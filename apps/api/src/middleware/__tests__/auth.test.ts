import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authMiddleware, requireAuth, requireAdmin } from '../auth';
import type { AuthSession } from '../../types';
import { createMockEnv } from '../../test/setup';

const mockGetSession = vi.fn();

vi.mock('../../lib/auth', () => ({
  getAuth: vi.fn(() => ({
    api: {
      getSession: mockGetSession,
    },
  })),
}));

describe('authMiddleware', () => {
  let mockContext: any;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNext = vi.fn().mockResolvedValue(undefined);
    
    mockContext = {
      env: createMockEnv(),
      req: {
        url: 'https://api.example.com/test',
        raw: {
          headers: new Headers({
            'cookie': 'session-token=abc123',
          }),
        },
      },
      set: vi.fn(),
      json: vi.fn((data: any, status?: number) => ({
        status: status || 200,
        json: async () => data,
      })),
    };
  });

  it('should set userId and session when session exists', async () => {
    const mockSession: AuthSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        image: null,
        role: 'user',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        expiresAt: '2024-12-31T23:59:59Z',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        impersonatedBy: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    mockGetSession.mockResolvedValue(mockSession);

    await authMiddleware(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).toHaveBeenCalledWith('userId', 'user-123');
    expect(mockContext.set).toHaveBeenCalledWith('session', mockSession);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should continue without setting userId or session when no session exists', async () => {
    mockGetSession.mockResolvedValue(null);

    await authMiddleware(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('requireAuth', () => {
  let mockContext: any;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNext = vi.fn().mockResolvedValue(undefined);
    
    mockContext = {
      env: createMockEnv(),
      req: {
        url: 'https://api.example.com/test',
        raw: {
          headers: new Headers({
            'cookie': 'session-token=abc123',
          }),
        },
      },
      set: vi.fn(),
      json: vi.fn((data: any, status?: number) => ({
        status: status || 200,
        json: async () => data,
      })),
    };
  });

  it('should set userId and session when session exists', async () => {
    const mockSession: AuthSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        image: null,
        role: 'user',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        expiresAt: '2024-12-31T23:59:59Z',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        impersonatedBy: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    mockGetSession.mockResolvedValue(mockSession);

    await requireAuth(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).toHaveBeenCalledWith('userId', 'user-123');
    expect(mockContext.set).toHaveBeenCalledWith('session', mockSession);
    expect(mockNext).toHaveBeenCalled();
    expect(mockContext.json).not.toHaveBeenCalled();
  });

  it('should return 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await requireAuth(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(result?.status).toBe(401);
  });
});

describe('requireAdmin', () => {
  let mockContext: any;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNext = vi.fn().mockResolvedValue(undefined);
    
    mockContext = {
      env: createMockEnv(),
      req: {
        url: 'https://api.example.com/test',
        raw: {
          headers: new Headers({
            'cookie': 'session-token=abc123',
          }),
        },
      },
      set: vi.fn(),
      json: vi.fn((data: any, status?: number) => ({
        status: status || 200,
        json: async () => data,
      })),
    };
  });

  it('should set userId and session when admin session exists', async () => {
    const mockSession: AuthSession = {
      user: {
        id: 'admin-123',
        name: 'Admin User',
        email: 'admin@example.com',
        emailVerified: true,
        image: null,
        role: 'admin',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      session: {
        id: 'session-123',
        userId: 'admin-123',
        token: 'token-123',
        expiresAt: '2024-12-31T23:59:59Z',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        impersonatedBy: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    mockGetSession.mockResolvedValue(mockSession);

    await requireAdmin(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).toHaveBeenCalledWith('userId', 'admin-123');
    expect(mockContext.set).toHaveBeenCalledWith('session', mockSession);
    expect(mockNext).toHaveBeenCalled();
    expect(mockContext.json).not.toHaveBeenCalled();
  });

  it('should return 401 when no session exists', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await requireAdmin(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(result?.status).toBe(401);
  });

  it('should return 403 when user is not admin', async () => {
    const mockSession: AuthSession = {
      user: {
        id: 'user-123',
        name: 'Regular User',
        email: 'user@example.com',
        emailVerified: true,
        image: null,
        role: 'user',
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'token-123',
        expiresAt: '2024-12-31T23:59:59Z',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        impersonatedBy: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };

    mockGetSession.mockResolvedValue(mockSession);

    const result = await requireAdmin(mockContext, mockNext);

    expect(mockGetSession).toHaveBeenCalledWith({
      headers: mockContext.req.raw.headers,
    });
    expect(mockContext.set).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockContext.json).toHaveBeenCalledWith({ error: 'Forbidden - Admin access required' }, 403);
    expect(result?.status).toBe(403);
  });
});
