import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn((path: string) => (config: any) => ({
    ...config,
    id: path,
    path,
    useLoaderData: vi.fn(),
    update: function (c: any) { Object.assign(this, c); return this; },
    _addFileChildren: function (c: any) { return this; },
    _addFileTypes: function () { return this; },
  })),
  createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
    id: '__root__',
    update: function (c: any) { Object.assign(this, c); return this; },
    _addFileChildren: function (c: any) { return this; },
    _addFileTypes: function () { return this; },
  }))),
  createRoute: vi.fn((config: any) => ({
    ...config,
    id: config.path || 'mock-route',
    update: function (c: any) { Object.assign(this, c); return this; },
  })),
  redirect: vi.fn((config: any) => {
    const error: any = new Error('Redirect');
    error.to = config.to;
    throw error;
  }),
}));

// Import after mocks are set up
import { appIndexRoute as Route } from '@/features/app/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/');
  });

  it('should have beforeLoad function', () => {
    expect(route.beforeLoad).toBeDefined();
    expect(typeof route.beforeLoad).toBe('function');
  });

  it('should redirect to /app/dashboard', async () => {
    const { redirect } = await import('@tanstack/react-router');

    try {
      route.beforeLoad();
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Should throw redirect error
      expect(error).toBeDefined();
      expect(redirect).toHaveBeenCalledWith({ to: '/app/dashboard' });
    }
  });

  it('should throw redirect error when beforeLoad is called', () => {
    expect(() => route.beforeLoad()).toThrow();
  });
});
