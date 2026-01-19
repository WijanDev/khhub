import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StorageManager,
  StoragePaths,
  AllowedFileTypes,
  MaxFileSizes,
  createTenantStorage,
  createUserStorage,
  createStorageManager,
} from '@storage/infrastructure/r2-storage';

type MockR2Data = ArrayBuffer | Blob | ReadableStream | string;

function createMockR2Bucket(): R2Bucket {
  const store = new Map<string, {
    data: MockR2Data;
    httpMetadata?: R2HTTPMetadata;
    customMetadata?: Record<string, string>;
    uploaded: Date;
    etag: string;
    size: number;
  }>();

  return {
    put: vi.fn(async (key: string, data: MockR2Data, options?: R2PutOptions) => {
      let size = 0;
      if (typeof data === 'string') {
        size = new TextEncoder().encode(data).length;
      } else if (data instanceof ArrayBuffer) {
        size = data.byteLength;
      } else if (data instanceof Blob) {
        size = data.size;
      }

      const httpMetadata = options?.httpMetadata && typeof options.httpMetadata === 'object' && !('get' in options.httpMetadata)
        ? options.httpMetadata
        : undefined;

      store.set(key, {
        data,
        httpMetadata,
        customMetadata: options?.customMetadata,
        uploaded: new Date(),
        etag: `"${key}-etag"`,
        size,
      });

      return {
        key,
        size,
        etag: `"${key}-etag"`,
        uploaded: new Date(),
        httpMetadata,
        customMetadata: options?.customMetadata,
      } as R2Object;
    }),

    get: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;

      let body: MockR2Data;

      if (typeof item.data === 'string') {
        body = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(item.data as string));
            controller.close();
          }
        });
      } else if (item.data instanceof ArrayBuffer) {
        body = new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(item.data as ArrayBuffer));
            controller.close();
          }
        });
      } else {
        body = item.data;
      }

      return {
        key,
        size: item.size,
        etag: item.etag,
        uploaded: item.uploaded,
        httpMetadata: item.httpMetadata,
        customMetadata: item.customMetadata,
        body,
      } as R2ObjectBody;
    }),

    head: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;

      return {
        key,
        size: item.size,
        etag: item.etag,
        uploaded: item.uploaded,
        httpMetadata: item.httpMetadata,
        customMetadata: item.customMetadata,
      } as R2Object;
    }),

    delete: vi.fn(async (key: string | string[]) => {
      const keys = Array.isArray(key) ? key : [key];
      keys.forEach(k => store.delete(k));
    }),

    list: vi.fn(async (options?: R2ListOptions) => {
      const prefix = options?.prefix || '';
      const limit = options?.limit || 1000;
      const delimiter = options?.delimiter;

      let matchingKeys = Array.from(store.keys()).filter(k => k.startsWith(prefix));

      if (delimiter) {
        const prefixMap = new Map<string, boolean>();
        matchingKeys = matchingKeys.filter(k => {
          const afterPrefix = k.slice(prefix.length);
          const delimiterIndex = afterPrefix.indexOf(delimiter);
          if (delimiterIndex === -1) return true;
          const prefixKey = k.slice(0, prefix.length + delimiterIndex + delimiter.length);
          if (prefixMap.has(prefixKey)) return false;
          prefixMap.set(prefixKey, true);
          return false;
        });
      }

      const objects = matchingKeys.slice(0, limit).map(key => {
        const item = store.get(key)!;
        return {
          key,
          size: item.size,
          etag: item.etag,
          uploaded: item.uploaded,
          httpMetadata: item.httpMetadata,
          customMetadata: item.customMetadata,
        } as R2Object;
      });

      const truncated = matchingKeys.length > limit;
      const delimitedPrefixes = delimiter ? Array.from(new Set(
        matchingKeys
          .map(k => {
            const afterPrefix = k.slice(prefix.length);
            const delimiterIndex = afterPrefix.indexOf(delimiter);
            if (delimiterIndex === -1) return null;
            return k.slice(0, prefix.length + delimiterIndex + delimiter.length);
          })
          .filter((p): p is string => p !== null)
      )) : undefined;

      return {
        objects,
        truncated,
        cursor: truncated ? 'next-cursor' : undefined,
        delimitedPrefixes,
      } as R2Objects;
    }),
  } as unknown as R2Bucket;
}

describe('StorageManager', () => {
  let mockBucket: R2Bucket;

  beforeEach(() => {
    mockBucket = createMockR2Bucket();
  });

  describe('constructor', () => {
    it('should create instance with or without prefix', () => {
      expect(new StorageManager(mockBucket)).toBeDefined();
      expect(new StorageManager(mockBucket, 'tenant-123')).toBeDefined();
    });
  });

  describe('upload', () => {
    it('should upload file with various options and data types', async () => {
      const manager = new StorageManager(mockBucket);
      const result1 = await manager.upload('test.txt', new ArrayBuffer(100));
      expect(result1.key).toBe('test.txt');
      expect(result1.size).toBe(100);

      const result2 = await manager.upload('test.jpg', 'content', { contentType: 'image/jpeg' });
      expect(result2.contentType).toBe('image/jpeg');

      const result3 = await manager.upload('test.txt', 'content', { metadata: { key: 'value' } });
      expect(result3.metadata).toEqual({ key: 'value' });

      const blob = new Blob(['test']);
      const result4 = await manager.upload('blob.txt', blob);
      expect(result4.size).toBeGreaterThan(0);

      const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('test')); c.close(); } });
      const result5 = await manager.upload('stream.txt', stream);
      expect(result5).toBeDefined();
    });

    it('should prefix key when basePrefix is set', async () => {
      const manager = new StorageManager(mockBucket, 'tenant-123');
      const result = await manager.upload('file.txt', 'content');
      expect(result.key).toBe('tenant-123/file.txt');
    });
  });

  describe('download', () => {
    it('should download existing file with metadata', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('test.txt', 'content', {
        contentType: 'text/plain',
        metadata: { key: 'value' },
      });

      const result = await manager.download('test.txt');
      expect(result).not.toBeNull();
      expect(result?.info.key).toBe('test.txt');
      expect(result?.info.contentType).toBe('text/plain');
      expect(result?.info.metadata).toEqual({ key: 'value' });
      expect(result?.data).toBeDefined();
    });

    it('should return null for non-existent file', async () => {
      const manager = new StorageManager(mockBucket);
      expect(await manager.download('non-existent.txt')).toBeNull();
    });

    it('should prefix key when basePrefix is set', async () => {
      const manager = new StorageManager(mockBucket, 'tenant-123');
      await manager.upload('file.txt', 'content');
      const result = await manager.download('file.txt');
      expect(result?.info.key).toBe('tenant-123/file.txt');
    });
  });

  describe('head', () => {
    it('should get file info with metadata', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('test.txt', 'content', {
        contentType: 'text/plain',
        metadata: { key: 'value' },
      });

      const result = await manager.head('test.txt');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('test.txt');
      expect(result?.contentType).toBe('text/plain');
      expect(result?.metadata).toEqual({ key: 'value' });
    });

    it('should return null for non-existent file', async () => {
      const manager = new StorageManager(mockBucket);
      expect(await manager.head('non-existent.txt')).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete file and handle prefix', async () => {
      const manager1 = new StorageManager(mockBucket);
      await manager1.upload('test.txt', 'content');
      await manager1.delete('test.txt');
      expect(await manager1.head('test.txt')).toBeNull();

      const manager2 = new StorageManager(mockBucket, 'tenant-123');
      await manager2.upload('file.txt', 'content');
      await manager2.delete('file.txt');
      expect(await manager2.head('file.txt')).toBeNull();
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple files and handle prefix', async () => {
      const manager1 = new StorageManager(mockBucket);
      await manager1.upload('file1.txt', 'content1');
      await manager1.upload('file2.txt', 'content2');
      await manager1.upload('file3.txt', 'content3');
      await manager1.deleteMany(['file1.txt', 'file2.txt']);
      expect(await manager1.head('file1.txt')).toBeNull();
      expect(await manager1.head('file2.txt')).toBeNull();
      expect(await manager1.head('file3.txt')).not.toBeNull();

      const manager2 = new StorageManager(mockBucket, 'tenant-123');
      await manager2.upload('file1.txt', 'content1');
      await manager2.upload('file2.txt', 'content2');
      await manager2.deleteMany(['file1.txt', 'file2.txt']);
      expect(await manager2.head('file1.txt')).toBeNull();
      expect(await manager2.head('file2.txt')).toBeNull();
    });
  });

  describe('list', () => {
    it('should list files with various options', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('file1.txt', 'content1');
      await manager.upload('file2.txt', 'content2');
      await manager.upload('folder1/file1.txt', 'content1');
      await manager.upload('folder2/file2.txt', 'content2');

      const result1 = await manager.list();
      expect(result1.files.length).toBeGreaterThanOrEqual(2);

      const result2 = await manager.list({ prefix: 'folder1' });
      expect(result2.files.every(f => f.key.startsWith('folder1'))).toBe(true);

      for (let i = 0; i < 10; i++) {
        await manager.upload(`file${i}.txt`, `content${i}`);
      }
      const result3 = await manager.list({ limit: 5 });
      expect(result3.files.length).toBeLessThanOrEqual(5);
      if (result3.truncated) {
        expect(result3.cursor).toBeDefined();
      }

      const result4 = await manager.list({ delimiter: '/' });
      expect(result4.prefixes).toBeDefined();
    });

    it('should prefix keys when basePrefix is set', async () => {
      const manager = new StorageManager(mockBucket, 'tenant-123');
      await manager.upload('file1.txt', 'content1');
      await manager.upload('file2.txt', 'content2');
      const result = await manager.list();
      expect(result.files.every(f => f.key.startsWith('tenant-123'))).toBe(true);
    });
  });

  describe('exists', () => {
    it('should return correct existence status', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('test.txt', 'content');
      expect(await manager.exists('test.txt')).toBe(true);
      expect(await manager.exists('non-existent.txt')).toBe(false);
    });
  });

  describe('copy', () => {
    it('should copy file preserving metadata', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('source.txt', 'content', {
        contentType: 'text/plain',
        metadata: { key: 'value' },
      });

      const result = await manager.copy('source.txt', 'dest.txt');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('dest.txt');
      expect(result?.contentType).toBe('text/plain');
      expect(result?.metadata).toEqual({ key: 'value' });
      expect(await manager.download('source.txt')).not.toBeNull();
      expect(await manager.download('dest.txt')).not.toBeNull();
    });

    it('should return null when source does not exist', async () => {
      const manager = new StorageManager(mockBucket);
      expect(await manager.copy('non-existent.txt', 'dest.txt')).toBeNull();
    });
  });

  describe('move', () => {
    it('should move file and delete source', async () => {
      const manager = new StorageManager(mockBucket);
      await manager.upload('source.txt', 'content');
      const result = await manager.move('source.txt', 'dest.txt');
      expect(result).not.toBeNull();
      expect(result?.key).toBe('dest.txt');
      expect(await manager.head('source.txt')).toBeNull();
      expect(await manager.head('dest.txt')).not.toBeNull();
    });

    it('should return null when source does not exist', async () => {
      const manager = new StorageManager(mockBucket);
      expect(await manager.move('non-existent.txt', 'dest.txt')).toBeNull();
    });
  });
});

describe('StoragePaths', () => {
  it('should build all path types correctly', () => {
    expect(StoragePaths.tenant('tenant-123')).toBe('tenants/tenant-123');
    expect(StoragePaths.tenantFile('tenant-123', 'file.txt')).toBe('tenants/tenant-123/files/file.txt');
    expect(StoragePaths.tenantAvatar('tenant-123')).toBe('tenants/tenant-123/avatar');
    expect(StoragePaths.user('user-123')).toBe('users/user-123');
    expect(StoragePaths.userAvatar('user-123')).toBe('users/user-123/avatar');
    expect(StoragePaths.userFile('user-123', 'file.txt')).toBe('users/user-123/files/file.txt');
    expect(StoragePaths.public('file.txt')).toBe('public/file.txt');
    expect(StoragePaths.temp('file.txt')).toBe('temp/file.txt');
  });
});

describe('AllowedFileTypes', () => {
  it('should define all file type categories', () => {
    expect(AllowedFileTypes.images).toContain('image/jpeg');
    expect(AllowedFileTypes.images).toContain('image/png');
    expect(AllowedFileTypes.documents).toContain('application/pdf');
    expect(AllowedFileTypes.spreadsheets).toContain('text/csv');
    expect(AllowedFileTypes.archives).toContain('application/zip');
  });
});

describe('MaxFileSizes', () => {
  it('should define all max file sizes', () => {
    expect(MaxFileSizes.avatar).toBe(5 * 1024 * 1024);
    expect(MaxFileSizes.image).toBe(10 * 1024 * 1024);
    expect(MaxFileSizes.document).toBe(50 * 1024 * 1024);
    expect(MaxFileSizes.default).toBe(100 * 1024 * 1024);
  });
});

describe('Factory functions', () => {
  let mockBucket: R2Bucket;

  beforeEach(() => {
    mockBucket = createMockR2Bucket();
  });

  it('should create storage managers with correct prefixes', async () => {
    const tenantManager = createTenantStorage(mockBucket, 'tenant-123');
    expect(tenantManager).toBeInstanceOf(StorageManager);
    const tenantResult = await tenantManager.upload('file.txt', 'content');
    expect(tenantResult.key).toBe('tenants/tenant-123/file.txt');

    const userManager = createUserStorage(mockBucket, 'user-123');
    expect(userManager).toBeInstanceOf(StorageManager);
    const userResult = await userManager.upload('file.txt', 'content');
    expect(userResult.key).toBe('users/user-123/file.txt');

    const globalManager = createStorageManager(mockBucket);
    expect(globalManager).toBeInstanceOf(StorageManager);
    const globalResult = await globalManager.upload('file.txt', 'content');
    expect(globalResult.key).toBe('file.txt');
  });
});
