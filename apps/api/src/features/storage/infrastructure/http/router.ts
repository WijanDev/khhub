import { Hono } from 'hono';
import type { Env, Variables } from '@shared/domain/types';
import { createStorageManager, StoragePaths, AllowedFileTypes, MaxFileSizes } from '../r2-storage';

// Chain routes for proper type inference (Hono RPC)
const storageRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
    // Upload file for a tenant
    .post('/tenants/:tenantId/files', async (c) => {
        const tenantId = c.req.param('tenantId');

        try {
            const formData = await c.req.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return c.json({ error: 'No file provided' }, 400);
            }

            // Validate file size
            if (file.size > MaxFileSizes.default) {
                return c.json({ error: 'File too large' }, 400);
            }

            const storageManager = createStorageManager(c.env.STORAGE);
            const filename = `${Date.now()}-${file.name}`;
            const path = StoragePaths.tenantFile(tenantId, filename);

            const result = await storageManager.upload(path, file, {
                contentType: file.type,
                metadata: {
                    originalName: file.name,
                    tenantId,
                    uploadedAt: new Date().toISOString(),
                },
            });

            return c.json({
                message: 'File uploaded',
                file: {
                    key: result.key,
                    size: result.size,
                    contentType: file.type,
                    originalName: file.name,
                },
            }, 201);
        } catch (error) {
            console.error('Error uploading file:', error);
            return c.json({ error: 'Failed to upload file' }, 500);
        }
    })
    // List files for a tenant
    .get('/tenants/:tenantId/files', async (c) => {
        const tenantId = c.req.param('tenantId');
        const cursor = c.req.query('cursor');
        const limit = Number.parseInt(c.req.query('limit') || '50');

        try {
            const storageManager = createStorageManager(c.env.STORAGE);
            const result = await storageManager.list({
                prefix: `${StoragePaths.tenant(tenantId)}/files`,
                limit,
                cursor,
            });

            return c.json({
                files: result.files,
                hasMore: result.truncated,
                cursor: result.cursor,
            });
        } catch (error) {
            console.error('Error listing files:', error);
            return c.json({ error: 'Failed to list files' }, 500);
        }
    })
    // Get file info (metadata only) - must come before /files/* to match correctly
    .get('/files/info/*', async (c) => {
        let path = pathHandler(c.req.path);

        try {
            const storageManager = createStorageManager(c.env.STORAGE);
            const info = await storageManager.head(path);

            if (!info) {
                return c.json({ error: 'File not found' }, 404);
            }

            return c.json({
                file: {
                    key: info.key,
                    size: info.size,
                    contentType: info.contentType,
                    etag: info.etag,
                    uploaded: info.uploaded,
                    metadata: info.metadata,
                },
            });
        } catch (error) {
            console.error('Error getting file info:', error);
            return c.json({ error: 'Failed to get file info' }, 500);
        }
    })
    // Download file - must come after /files/info/* to match correctly
    .get('/files/*', async (c) => {
        let path = pathHandler(c.req.path);

        try {
            const storageManager = createStorageManager(c.env.STORAGE);
            const file = await storageManager.download(path);

            if (!file) {
                return c.json({ error: 'File not found' }, 404);
            }

            return new Response(file.data, {
                headers: {
                    'Content-Type': file.info.contentType || 'application/octet-stream',
                    'Content-Length': file.info.size.toString(),
                    'ETag': file.info.etag,
                    'Cache-Control': 'public, max-age=31536000',
                },
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            return c.json({ error: 'Failed to download file' }, 500);
        }
    })
    // Delete file
    .delete('/files/*', async (c) => {
        let path = pathHandler(c.req.path);

        try {
            const storageManager = createStorageManager(c.env.STORAGE);

            // Check if file exists first
            const exists = await storageManager.exists(path);
            if (!exists) {
                return c.json({ error: 'File not found' }, 404);
            }

            await storageManager.delete(path);

            return c.json({ message: 'File deleted', path });
        } catch (error) {
            console.error('Error deleting file:', error);
            return c.json({ error: 'Failed to delete file' }, 500);
        }
    })
    // Upload user avatar
    .post('/users/:userId/avatar', async (c) => {
        const userId = c.req.param('userId');

        try {
            const formData = await c.req.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return c.json({ error: 'No file provided' }, 400);
            }

            // Validate file type
            if (!AllowedFileTypes.images.includes(file.type)) {
                return c.json({ error: 'Invalid file type. Only images allowed.' }, 400);
            }

            // Validate file size
            if (file.size > MaxFileSizes.avatar) {
                return c.json({ error: 'File too large. Max 5MB for avatars.' }, 400);
            }

            const storageManager = createStorageManager(c.env.STORAGE);
            const path = StoragePaths.userAvatar(userId);

            // Delete existing avatar if any
            await storageManager.delete(path).catch(() => { });

            const result = await storageManager.upload(path, file, {
                contentType: file.type,
                cacheControl: 'public, max-age=86400',
                metadata: {
                    userId,
                    uploadedAt: new Date().toISOString(),
                },
            });

            return c.json({
                message: 'Avatar uploaded',
                avatar: {
                    key: result.key,
                    url: `/api/storage/files/${result.key}`,
                },
            }, 201);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return c.json({ error: 'Failed to upload avatar' }, 500);
        }
    })
    // Get user avatar
    .get('/users/:userId/avatar', async (c) => {
        const userId = c.req.param('userId');

        try {
            const storageManager = createStorageManager(c.env.STORAGE);
            const path = StoragePaths.userAvatar(userId);
            const file = await storageManager.download(path);

            if (!file) {
                return c.json({ error: 'Avatar not found' }, 404);
            }

            return new Response(file.data, {
                headers: {
                    'Content-Type': file.info.contentType || 'image/png',
                    'Content-Length': file.info.size.toString(),
                    'ETag': file.info.etag,
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        } catch (error) {
            console.error('Error getting avatar:', error);
            return c.json({ error: 'Failed to get avatar' }, 500);
        }
    })
    // Delete user avatar
    .delete('/users/:userId/avatar', async (c) => {
        const userId = c.req.param('userId');

        try {
            const storageManager = createStorageManager(c.env.STORAGE);
            const path = StoragePaths.userAvatar(userId);

            const exists = await storageManager.exists(path);
            if (!exists) {
                return c.json({ error: 'Avatar not found' }, 404);
            }

            await storageManager.delete(path);

            return c.json({ message: 'Avatar deleted' });
        } catch (error) {
            console.error('Error deleting avatar:', error);
            return c.json({ error: 'Failed to delete avatar' }, 500);
        }
    });

const pathHandler = (path: string) => {
    let returnPath = path;
    if (path.startsWith('/api/storage/files/info/')) {
        returnPath = path.replace('/api/storage/files/info/', '');
    } else if (path.startsWith('/storage/files/info/')) {
        returnPath = path.replace('/storage/files/info/', '');
    } else if (path.startsWith('/files/info/')) {
        returnPath = path.replace('/files/info/', '');
    } else if (path.startsWith('/files/')) {
        returnPath = path.replace('/files/', '');
    } else if (path.startsWith('/api/storage/files/')) {
        returnPath = path.replace('/api/storage/files/', '');
    } else if (path.startsWith('/storage/files/')) {
        returnPath = path.replace('/storage/files/', '');
    }

    return returnPath;
}

export default storageRoutes;
