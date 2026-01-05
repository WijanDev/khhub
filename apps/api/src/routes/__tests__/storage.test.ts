import { describe, it, expect, vi, beforeEach } from 'vitest';
import storageRoutes from '../storage';
import { createMockEnv } from '../../test/setup';
import type { Env, Variables } from '../../types';
import { Hono } from 'hono';

const mockUpload = vi.fn();
const mockDownload = vi.fn();
const mockHead = vi.fn();
const mockList = vi.fn();
const mockExists = vi.fn();
const mockDelete = vi.fn();

function createMockR2Bucket(): R2Bucket {
  return {} as R2Bucket;
}

vi.mock('../../lib/storage', async () => {
  const actual = await vi.importActual('../../lib/storage');
  return {
    ...actual,
    createStorageManager: vi.fn(() => ({
      upload: mockUpload,
      download: mockDownload,
      head: mockHead,
      list: mockList,
      exists: mockExists,
      delete: mockDelete,
    })),
    StoragePaths: {
      tenant: vi.fn((tenantId: string) => `tenants/${tenantId}`),
      tenantFile: vi.fn((tenantId: string, filename: string) => `tenants/${tenantId}/files/${filename}`),
      userAvatar: vi.fn((userId: string) => `users/${userId}/avatar`),
    },
    AllowedFileTypes: {
      images: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    },
    MaxFileSizes: {
      default: 10 * 1024 * 1024,
      avatar: 5 * 1024 * 1024,
    },
  };
});

describe('storageRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /tenants/:tenantId/files', () => {
    it('should upload file successfully', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      mockUpload.mockResolvedValue({
        key: 'tenants/tenant-123/files/1234567890-test.txt',
        size: 12,
        etag: '"etag-123"',
        uploaded: new Date(),
      });

      const req = new Request('https://api.example.com/tenants/tenant-123/files', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data).toEqual({
        message: 'File uploaded',
        file: {
          key: 'tenants/tenant-123/files/1234567890-test.txt',
          size: 12,
          contentType: 'text/plain',
          originalName: 'test.txt',
        },
      });
      expect(mockUpload).toHaveBeenCalledWith(expect.stringContaining('tenants/tenant-123/files/'), expect.any(File), expect.any(Object));
    });

    it('should return 400 when no file provided', async () => {
      const formData = new FormData();

      const req = new Request('https://api.example.com/tenants/tenant-123/files', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({ error: 'No file provided' });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should return 400 when file is too large', async () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      const req = new Request('https://api.example.com/tenants/tenant-123/files', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({ error: 'File too large' });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      mockUpload.mockRejectedValue(new Error('Upload failed'));

      const req = new Request('https://api.example.com/tenants/tenant-123/files', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to upload file' });
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /tenants/:tenantId/files', () => {
    it('should list files successfully', async () => {
      mockList.mockResolvedValue({
        files: [
          {
            key: 'tenants/tenant-123/files/file1.txt',
            size: 100,
            etag: '"etag1"',
            uploaded: new Date(),
            contentType: 'text/plain',
          },
        ],
        truncated: false,
        cursor: undefined,
      });

      const req = new Request('https://api.example.com/tenants/tenant-123/files');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = (await res.json()) as { files: Array<{ key: string; size: number; etag: string; contentType: string; uploaded: string }>; hasMore: boolean; cursor?: string };

      expect(res.status).toBe(200);
      expect(data.files).toHaveLength(1);
      expect(data.files[0]).toMatchObject({
        key: 'tenants/tenant-123/files/file1.txt',
        size: 100,
        etag: '"etag1"',
        contentType: 'text/plain',
      });
      expect(typeof data.files[0].uploaded).toBe('string');
      expect(new Date(data.files[0].uploaded).toISOString()).toBe(data.files[0].uploaded);
      expect(data.hasMore).toBe(false);
      expect(data.cursor).toBeUndefined();
      expect(mockList).toHaveBeenCalledWith({
        prefix: 'tenants/tenant-123/files',
        limit: 50,
        cursor: undefined,
      });
    });

    it('should handle query parameters', async () => {
      mockList.mockResolvedValue({
        files: [],
        truncated: true,
        cursor: 'next-cursor',
      });

      const req = new Request('https://api.example.com/tenants/tenant-123/files?limit=10&cursor=prev-cursor');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = (await res.json()) as { hasMore: boolean; cursor?: string };

      expect(res.status).toBe(200);
      expect(data.hasMore).toBe(true);
      expect(data.cursor).toBe('next-cursor');
      expect(mockList).toHaveBeenCalledWith({
        prefix: 'tenants/tenant-123/files',
        limit: 10,
        cursor: 'prev-cursor',
      });
    });

    it('should handle list errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockList.mockRejectedValue(new Error('List failed'));

      const req = new Request('https://api.example.com/tenants/tenant-123/files');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to list files' });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /files/*', () => {
    it('should download file successfully', async () => {
      const fileData = new ReadableStream();
      mockDownload.mockResolvedValue({
        data: fileData,
        info: {
          key: 'tenants/tenant-123/files/file.txt',
          size: 100,
          etag: '"etag-123"',
          uploaded: new Date(),
          contentType: 'text/plain',
        },
      });

      const req = new Request('https://api.example.com/files/tenants/tenant-123/files/file.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/plain');
      expect(res.headers.get('Content-Length')).toBe('100');
      expect(res.headers.get('ETag')).toBe('"etag-123"');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000');
      expect(mockDownload).toHaveBeenCalledWith('tenants/tenant-123/files/file.txt');
    });

    it('should return 404 when file not found', async () => {
      mockDownload.mockResolvedValue(null);

      const req = new Request('https://api.example.com/files/nonexistent.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
    });

    it('should use default content type when not provided', async () => {
      const fileData = new ReadableStream();
      mockDownload.mockResolvedValue({
        data: fileData,
        info: {
          key: 'file.txt',
          size: 100,
          etag: '"etag"',
          uploaded: new Date(),
        },
      });

      const req = new Request('https://api.example.com/files/file.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    });

    it('should handle download errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDownload.mockRejectedValue(new Error('Download failed'));

      const req = new Request('https://api.example.com/files/file.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to download file' });
      consoleErrorSpy.mockRestore();
    });

    it.each([
      ['/api/storage', '/api/storage/files/test-file.txt'],
      ['/storage', '/storage/files/test-file.txt'],
    ])('should handle %s path prefix', async (mountPath, requestPath) => {
      const fileData = new ReadableStream();
      mockDownload.mockResolvedValue({
        data: fileData,
        info: {
          key: 'test-file.txt',
          size: 100,
          etag: '"etag-123"',
          uploaded: new Date(),
          contentType: 'text/plain',
        },
      });

      const app = new Hono<{ Bindings: Env; Variables: Variables }>().route(mountPath, storageRoutes);
      const req = new Request(`https://api.example.com${requestPath}`);

      const res = await app.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/plain');
      expect(mockDownload).toHaveBeenCalledWith('test-file.txt');
    });
  });

  describe('GET /files/info/*', () => {
    it('should get file info successfully', async () => {
      mockHead.mockResolvedValue({
        key: 'tenants/tenant-123/files/file.txt',
        size: 100,
        etag: '"etag-123"',
        uploaded: new Date(),
        contentType: 'text/plain',
        metadata: {
          originalName: 'file.txt',
        },
      });

      const req = new Request('https://api.example.com/files/info/tenants/tenant-123/files/file.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = (await res.json()) as { file: { key: string; size: number; contentType: string; etag: string; uploaded: string; metadata: Record<string, string> } };

      expect(res.status).toBe(200);
      expect(data.file).toMatchObject({
        key: 'tenants/tenant-123/files/file.txt',
        size: 100,
        contentType: 'text/plain',
        etag: '"etag-123"',
        metadata: {
          originalName: 'file.txt',
        },
      });
      expect(typeof data.file.uploaded).toBe('string');
      expect(new Date(data.file.uploaded).toISOString()).toBe(data.file.uploaded);
    });

    it('should return 404 when file not found', async () => {
      mockHead.mockResolvedValue(null);

      const req = new Request('https://api.example.com/files/info/nonexistent.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
    });

    it('should handle info errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockHead.mockRejectedValue(new Error('Info failed'));

      const req = new Request('https://api.example.com/files/info/file.txt');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to get file info' });
      consoleErrorSpy.mockRestore();
    });

    it.each([
      ['/api/storage', '/api/storage/files/info/test-file.txt'],
      ['/storage', '/storage/files/info/test-file.txt'],
    ])('should handle %s path prefix', async (mountPath, requestPath) => {
      mockHead.mockResolvedValue({
        key: 'test-file.txt',
        size: 100,
        etag: '"etag-123"',
        uploaded: new Date(),
        contentType: 'text/plain',
        metadata: {
          originalName: 'test-file.txt',
        },
      });

      const app = new Hono<{ Bindings: Env; Variables: Variables }>().route(mountPath, storageRoutes);
      const req = new Request(`https://api.example.com${requestPath}`);

      const res = await app.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = (await res.json()) as { file: { key: string; size: number; contentType: string; etag: string; metadata: Record<string, string> } };

      expect(res.status).toBe(200);
      expect(data.file).toMatchObject({
        key: 'test-file.txt',
        size: 100,
        contentType: 'text/plain',
        etag: '"etag-123"',
        metadata: {
          originalName: 'test-file.txt',
        },
      });
      expect(mockHead).toHaveBeenCalledWith('test-file.txt');
    });
  });

  describe('DELETE /files/*', () => {
    it('should delete file successfully', async () => {
      mockExists.mockResolvedValue(true);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/files/tenants/tenant-123/files/file.txt', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        message: 'File deleted',
        path: 'tenants/tenant-123/files/file.txt',
      });
      expect(mockExists).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return 404 when file not found', async () => {
      mockExists.mockResolvedValue(false);

      const req = new Request('https://api.example.com/files/nonexistent.txt', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'File not found' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockExists.mockResolvedValue(true);
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const req = new Request('https://api.example.com/files/file.txt', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete file' });
      consoleErrorSpy.mockRestore();
    });

    it.each([
      ['/api/storage', '/api/storage/files/test-file.txt'],
      ['/storage', '/storage/files/test-file.txt'],
    ])('should handle %s path prefix for DELETE', async (mountPath, requestPath) => {
      mockExists.mockResolvedValue(true);
      mockDelete.mockResolvedValue(undefined);

      const app = new Hono<{ Bindings: Env; Variables: Variables }>().route(mountPath, storageRoutes);
      const req = new Request(`https://api.example.com${requestPath}`, {
        method: 'DELETE',
      });

      const res = await app.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({
        message: 'File deleted',
        path: 'test-file.txt',
      });
      expect(mockExists).toHaveBeenCalledWith('test-file.txt');
      expect(mockDelete).toHaveBeenCalledWith('test-file.txt');
    });
  });

  describe('POST /users/:userId/avatar', () => {
    it('should upload avatar successfully', async () => {
      const file = new File(['image data'], 'avatar.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);

      mockDelete.mockResolvedValue(undefined);
      mockUpload.mockResolvedValue({
        key: 'users/user-123/avatar',
        size: 100,
        etag: '"etag-123"',
        uploaded: new Date(),
      });

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data).toEqual({
        message: 'Avatar uploaded',
        avatar: {
          key: 'users/user-123/avatar',
          url: '/api/storage/files/users/user-123/avatar',
        },
      });
      expect(mockUpload).toHaveBeenCalledWith('users/user-123/avatar', expect.any(File), expect.any(Object));
    });

    it('should return 400 when no file provided', async () => {
      const formData = new FormData();

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({ error: 'No file provided' });
    });

    it('should return 400 when file type is not an image', async () => {
      const file = new File(['content'], 'file.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid file type. Only images allowed.' });
    });

    it('should return 400 when avatar file is too large', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      const file = new File([largeContent], 'avatar.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data).toEqual({ error: 'File too large. Max 5MB for avatars.' });
    });

    it('should handle upload errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const file = new File(['image'], 'avatar.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);

      mockDelete.mockResolvedValue(undefined);
      mockUpload.mockRejectedValue(new Error('Upload failed'));

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'POST',
        body: formData,
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to upload avatar' });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('GET /users/:userId/avatar', () => {
    it('should get avatar successfully', async () => {
      const fileData = new ReadableStream();
      mockDownload.mockResolvedValue({
        data: fileData,
        info: {
          key: 'users/user-123/avatar',
          size: 100,
          etag: '"etag-123"',
          uploaded: new Date(),
          contentType: 'image/png',
        },
      });

      const req = new Request('https://api.example.com/users/user-123/avatar');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('image/png');
      expect(res.headers.get('Content-Length')).toBe('100');
      expect(res.headers.get('ETag')).toBe('"etag-123"');
      expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    });

    it('should return 404 when avatar not found', async () => {
      mockDownload.mockResolvedValue(null);

      const req = new Request('https://api.example.com/users/user-123/avatar');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Avatar not found' });
    });

    it('should use default content type when not provided', async () => {
      const fileData = new ReadableStream();
      mockDownload.mockResolvedValue({
        data: fileData,
        info: {
          key: 'users/user-123/avatar',
          size: 100,
          etag: '"etag"',
          uploaded: new Date(),
        },
      });

      const req = new Request('https://api.example.com/users/user-123/avatar');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));

      expect(res.headers.get('Content-Type')).toBe('image/png');
    });

    it('should handle get avatar errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDownload.mockRejectedValue(new Error('Download failed'));

      const req = new Request('https://api.example.com/users/user-123/avatar');

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to get avatar' });
      consoleErrorSpy.mockRestore();
    });
  });

  describe('DELETE /users/:userId/avatar', () => {
    it('should delete avatar successfully', async () => {
      mockExists.mockResolvedValue(true);
      mockDelete.mockResolvedValue(undefined);

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ message: 'Avatar deleted' });
      expect(mockExists).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return 404 when avatar not found', async () => {
      mockExists.mockResolvedValue(false);

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data).toEqual({ error: 'Avatar not found' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockExists.mockResolvedValue(true);
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const req = new Request('https://api.example.com/users/user-123/avatar', {
        method: 'DELETE',
      });

      const res = await storageRoutes.fetch(req, createMockEnv({ STORAGE: createMockR2Bucket() }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to delete avatar' });
      consoleErrorSpy.mockRestore();
    });
  });
});
