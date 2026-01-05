import { describe, it, expect, vi, beforeEach } from 'vitest';
import authRoutes from '../auth';
import { createMockEnv } from '../../test/setup';
import type { Env, Variables } from '../../types';

const mockHandler = vi.fn();

vi.mock('../../lib/auth', () => ({
  getAuth: vi.fn(() => ({
    handler: mockHandler,
  })),
}));

describe('authRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  it('should handle all routes and call auth handler', async () => {
    const req = new Request('https://api.example.com/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const res = await authRoutes.fetch(req, createMockEnv());

    expect(mockHandler).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });

  it('should pass through response from auth handler', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
    mockHandler.mockResolvedValue(mockResponse);

    const req = new Request('https://api.example.com/auth/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });

    const res = await authRoutes.fetch(req, createMockEnv());

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });

  it('should log 403 errors for debugging', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockResponse = new Response('Forbidden', { status: 403 });
    mockHandler.mockResolvedValue(mockResponse);

    const req = new Request('https://api.example.com/auth/session', {
      method: 'GET',
    });

    const res = await authRoutes.fetch(req, createMockEnv());

    expect(res.status).toBe(403);
    expect(consoleLogSpy).toHaveBeenCalledWith('Better Auth 403 Response Body:', 'Forbidden');
    consoleLogSpy.mockRestore();
  });

  it('should handle errors when reading 403 response body', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockResponse = {
      status: 403,
      clone: vi.fn(() => ({
        text: vi.fn().mockRejectedValue(new Error('Cannot read body')),
      })),
    };
    mockHandler.mockResolvedValue(mockResponse as any);

    const req = new Request('https://api.example.com/auth/session', {
      method: 'GET',
    });

    const res = await authRoutes.fetch(req, createMockEnv());

    expect(res.status).toBe(403);
    expect(consoleLogSpy).toHaveBeenCalledWith('Could not read response body:', expect.any(Error));
    consoleLogSpy.mockRestore();
  });

  it('should not log non-403 responses', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockResponse = new Response('Unauthorized', { status: 401 });
    mockHandler.mockResolvedValue(mockResponse);

    const req = new Request('https://api.example.com/auth/session', {
      method: 'GET',
    });

    const res = await authRoutes.fetch(req, createMockEnv());

    expect(res.status).toBe(401);
    expect(consoleLogSpy).not.toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should handle different HTTP methods', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      vi.clearAllMocks();
      const mockResponse = new Response('OK', { status: 200 });
      mockHandler.mockResolvedValue(mockResponse);

      const req = new Request('https://api.example.com/auth/test', {
        method,
      });

      const res = await authRoutes.fetch(req, createMockEnv());

      expect(res.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(req);
    }
  });

  it('should handle different auth endpoints', async () => {
    const endpoints = [
      '/auth/sign-up',
      '/auth/sign-in',
      '/auth/sign-out',
      '/auth/forget-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/resend-verification',
      '/auth/session',
    ];

    for (const endpoint of endpoints) {
      vi.clearAllMocks();
      const mockResponse = new Response('OK', { status: 200 });
      mockHandler.mockResolvedValue(mockResponse);

      const req = new Request(`https://api.example.com${endpoint}`, {
        method: 'POST',
      });

      const res = await authRoutes.fetch(req, createMockEnv());

      expect(res.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    }
  });

  it('should pass request with correct URL to auth handler', async () => {
    const req = new Request('https://api.example.com/auth/sign-in?redirect=/dashboard', {
      method: 'POST',
    });

    await authRoutes.fetch(req, createMockEnv());

    expect(mockHandler).toHaveBeenCalledWith(req);
    expect(mockHandler.mock.calls[0][0]).toBe(req);
  });

  it('should pass request headers to auth handler', async () => {
    const req = new Request('https://api.example.com/auth/session', {
      method: 'GET',
      headers: {
        'Cookie': 'session-token=abc123',
        'User-Agent': 'test-agent',
      },
    });

    await authRoutes.fetch(req, createMockEnv());

    expect(mockHandler).toHaveBeenCalledWith(req);
    const calledReq = mockHandler.mock.calls[0][0];
    expect(calledReq.headers.get('Cookie')).toBe('session-token=abc123');
    expect(calledReq.headers.get('User-Agent')).toBe('test-agent');
  });
});
