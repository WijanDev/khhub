/**
 * Storage utility for Cloudflare R2 (S3-compatible)
 * Provides typed file operations with tenant isolation
 */

/// <reference types="@cloudflare/workers-types" />

export interface UploadOptions {
    /** Content type (MIME type) */
    contentType?: string;
    /** Custom metadata */
    metadata?: Record<string, string>;
    /** Cache control header */
    cacheControl?: string;
}

export interface FileInfo {
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    contentType?: string;
    metadata?: Record<string, string>;
}

export interface ListOptions {
    /** Prefix to filter files */
    prefix?: string;
    /** Maximum number of files to return */
    limit?: number;
    /** Cursor for pagination */
    cursor?: string;
    /** Delimiter for hierarchical listing */
    delimiter?: string;
}

export interface ListResult {
    files: FileInfo[];
    truncated: boolean;
    cursor?: string;
    prefixes?: string[];
}

export class StorageManager {
    private readonly bucket: R2Bucket;
    private readonly basePrefix: string;

    constructor(bucket: R2Bucket, basePrefix: string = '') {
        this.bucket = bucket;
        this.basePrefix = basePrefix;
    }

    /**
     * Build full key with prefix
     */
    private key(path: string): string {
        return this.basePrefix ? `${this.basePrefix}/${path}` : path;
    }

    /**
     * Upload a file
     */
    async upload(
        path: string,
        data: ArrayBuffer | Blob | ReadableStream | string,
        options: UploadOptions = {}
    ): Promise<FileInfo> {
        const key = this.key(path);
        const { contentType, metadata, cacheControl } = options;

        const result = await this.bucket.put(key, data, {
            httpMetadata: {
                contentType: contentType || 'application/octet-stream',
                cacheControl,
            },
            customMetadata: metadata,
        });

        return {
            key,
            size: result.size,
            etag: result.etag,
            uploaded: result.uploaded,
            contentType,
            metadata,
        };
    }

    /**
     * Download a file
     */
    async download(path: string): Promise<{ data: ReadableStream; info: FileInfo } | null> {
        const key = this.key(path);
        const object = await this.bucket.get(key);

        if (!object) {
            return null;
        }

        return {
            data: object.body,
            info: {
                key,
                size: object.size,
                etag: object.etag,
                uploaded: object.uploaded,
                contentType: object.httpMetadata?.contentType,
                metadata: object.customMetadata,
            },
        };
    }

    /**
     * Get file info without downloading
     */
    async head(path: string): Promise<FileInfo | null> {
        const key = this.key(path);
        const object = await this.bucket.head(key);

        if (!object) {
            return null;
        }

        return {
            key,
            size: object.size,
            etag: object.etag,
            uploaded: object.uploaded,
            contentType: object.httpMetadata?.contentType,
            metadata: object.customMetadata,
        };
    }

    /**
     * Delete a file
     */
    async delete(path: string): Promise<void> {
        await this.bucket.delete(this.key(path));
    }

    /**
     * Delete multiple files
     */
    async deleteMany(paths: string[]): Promise<void> {
        await this.bucket.delete(paths.map((p) => this.key(p)));
    }

    /**
     * List files
     */
    async list(options: ListOptions = {}): Promise<ListResult> {
        const { prefix, limit = 100, cursor, delimiter } = options;
        const fullPrefix = prefix ? this.key(prefix) : this.basePrefix || undefined;

        const result = await this.bucket.list({
            prefix: fullPrefix,
            limit,
            cursor,
            delimiter,
        });

        return {
            files: result.objects.map((obj: R2Object) => ({
                key: obj.key,
                size: obj.size,
                etag: obj.etag,
                uploaded: obj.uploaded,
                contentType: obj.httpMetadata?.contentType,
                metadata: obj.customMetadata,
            })),
            truncated: result.truncated,
            cursor: result.truncated ? result.cursor : undefined,
            prefixes: result.delimitedPrefixes,
        };
    }

    /**
     * Check if file exists
     */
    async exists(path: string): Promise<boolean> {
        const info = await this.head(path);
        return info !== null;
    }

    /**
     * Copy a file
     */
    async copy(sourcePath: string, destPath: string): Promise<FileInfo | null> {
        const source = await this.download(sourcePath);
        if (!source) {
            return null;
        }

        return this.upload(destPath, source.data, {
            contentType: source.info.contentType,
            metadata: source.info.metadata,
        });
    }

    /**
     * Move a file (copy + delete)
     */
    async move(sourcePath: string, destPath: string): Promise<FileInfo | null> {
        const result = await this.copy(sourcePath, destPath);
        if (result) {
            await this.delete(sourcePath);
        }
        return result;
    }
}

/**
 * Storage path builders for consistent file organization
 */
export const StoragePaths = {
    // Tenant files
    tenant: (tenantId: string) => `tenants/${tenantId}`,
    tenantFile: (tenantId: string, filename: string) => `tenants/${tenantId}/files/${filename}`,
    tenantAvatar: (tenantId: string) => `tenants/${tenantId}/avatar`,

    // User files
    user: (userId: string) => `users/${userId}`,
    userAvatar: (userId: string) => `users/${userId}/avatar`,
    userFile: (userId: string, filename: string) => `users/${userId}/files/${filename}`,

    // Shared/public files
    public: (filename: string) => `public/${filename}`,

    // Temporary files
    temp: (filename: string) => `temp/${filename}`,
};

/**
 * Allowed file types and their MIME types
 */
export const AllowedFileTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

/**
 * Max file sizes (in bytes)
 */
export const MaxFileSizes = {
    avatar: 5 * 1024 * 1024,      // 5MB
    image: 10 * 1024 * 1024,     // 10MB
    document: 50 * 1024 * 1024,  // 50MB
    default: 100 * 1024 * 1024,  // 100MB
};

/**
 * Create a storage manager for a specific tenant
 */
export function createTenantStorage(bucket: R2Bucket, tenantId: string): StorageManager {
    return new StorageManager(bucket, StoragePaths.tenant(tenantId));
}

/**
 * Create a storage manager for a specific user
 */
export function createUserStorage(bucket: R2Bucket, userId: string): StorageManager {
    return new StorageManager(bucket, StoragePaths.user(userId));
}

/**
 * Create a global storage manager (no prefix)
 */
export function createStorageManager(bucket: R2Bucket): StorageManager {
    return new StorageManager(bucket);
}
