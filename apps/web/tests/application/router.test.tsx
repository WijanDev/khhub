import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock @tanstack/react-router
const mockCreateRouter = vi.fn();
const mockRouter = {
  routeTree: {},
  context: {},
  defaultPreload: 'intent',
};

mockCreateRouter.mockReturnValue(mockRouter);

vi.mock('@tanstack/react-router', () => ({
  createRouter: mockCreateRouter,
  createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
    ...config,
    id: '__root__',
    update: function (c: any) { Object.assign(this, c); return this; },
    _addFileChildren: function (c: any) { return this; },
    _addFileTypes: function () { return this; },
  }))),
  createFileRoute: vi.fn((path: string) => (config: any) => ({
    ...config,
    id: path,
    update: function (c: any) { Object.assign(this, c); return this; },
    _addFileChildren: function (c: any) { return this; },
    _addFileTypes: function () { return this; },
  })),
}));

// Mock @tanstack/react-router-ssr-query
const mockSetupRouterSsrQueryIntegration = vi.fn();
vi.mock('@tanstack/react-router-ssr-query', () => ({
  setupRouterSsrQueryIntegration: mockSetupRouterSsrQueryIntegration,
}));

// Mock TanstackQuery provider
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
};

const mockGetContext = vi.fn().mockReturnValue({
  queryClient: mockQueryClient,
});

const MockProvider = vi.fn(({ children }: { children: React.ReactNode }) => children);

vi.mock('@/shared/application/providers/tanstack-query', () => ({
  getContext: mockGetContext,
  Provider: MockProvider,
}));

// Mock routeTree
vi.mock('@/shared/presentation/routing/root', () => ({
  rootRoute: { addChildren: vi.fn(() => ({})) },
}));

vi.mock('@/features/public/presentation/routing', () => ({
  publicRouting: { addChildren: vi.fn(() => ({})) },
  homeRoute: {},
  aboutRoute: {},
}));

vi.mock('@/features/auth/presentation/routing', () => ({
  authRoute: { addChildren: vi.fn(() => ({})) },
  signInRoute: {},
  signUpRoute: {},
  forgotPasswordRoute: {},
  resetPasswordRoute: {},
  verifyEmailRoute: {},
}));

vi.mock('@/features/app/presentation/routing', () => ({
  appRoute: { addChildren: vi.fn(() => ({})) },
  dashboardRoute: {},
}));

vi.mock('@/features/users/presentation/routing', () => ({
  usersRoute: { addChildren: vi.fn(() => ({})) },
  usersIndexRoute: {},
}));

vi.mock('@/features/tenants/presentation/routing', () => ({
  tenantsRoute: { addChildren: vi.fn(() => ({})) },
  tenantsIndexRoute: {},
}));

vi.mock('@/features/settings/presentation/routing', () => ({
  settingsRoute: { addChildren: vi.fn(() => ({})) },
  settingsIndexRoute: {},
}));

describe('getRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should create router with routeTree', async () => {
    const { getRouter } = await import('../../src/router');

    getRouter();

    expect(mockCreateRouter).toHaveBeenCalledTimes(1);
    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    expect(createRouterCall.routeTree).toBeDefined();
  });

  it('should create router with context from TanstackQuery', async () => {
    const mockContext = {
      queryClient: mockQueryClient,
    };
    mockGetContext.mockReturnValue(mockContext);

    const { getRouter } = await import('../../src/router');

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    expect(createRouterCall.context).toEqual(mockContext);
  });

  it('should create router with defaultPreload set to "intent"', async () => {
    const { getRouter } = await import('../../src/router');

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    expect(createRouterCall.defaultPreload).toBe('intent');
  });

  it('should create router with Wrap component', async () => {
    const { getRouter } = await import('../../src/router');

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    expect(createRouterCall.Wrap).toBeDefined();
    expect(typeof createRouterCall.Wrap).toBe('function');
  });

  it('should Wrap component be a function', async () => {
    const { getRouter } = await import('../../src/router');

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    const Wrap = createRouterCall.Wrap;

    expect(typeof Wrap).toBe('function');
  });

  it('should Wrap component return React element with Provider', async () => {
    const { getRouter } = await import('../../src/router');

    const mockContext = {
      queryClient: mockQueryClient,
    };
    mockGetContext.mockReturnValue(mockContext);

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    const Wrap = createRouterCall.Wrap;

    const mockChildren = <div>Test Children</div>;

    // Render the Wrap component to verify it works
    const { container } = render(Wrap({ children: mockChildren }));

    // Verify it renders children
    expect(container).toBeDefined();

    // Verify Provider was used (it wraps the children)
    expect(MockProvider).toHaveBeenCalled();
  });

  it('should Wrap component return React element', async () => {
    const { getRouter } = await import('../../src/router');

    const mockContext = {
      queryClient: mockQueryClient,
    };
    mockGetContext.mockReturnValue(mockContext);

    getRouter();

    const createRouterCall = mockCreateRouter.mock.calls[0][0];
    const Wrap = createRouterCall.Wrap;

    const mockChildren = <div>Test Children</div>;
    const result = Wrap({ children: mockChildren });

    expect(React.isValidElement(result)).toBe(true);
  });

  it('should setup SSR query integration', async () => {
    const { getRouter } = await import('../../src/router');

    getRouter();

    expect(mockSetupRouterSsrQueryIntegration).toHaveBeenCalledTimes(1);
    expect(mockSetupRouterSsrQueryIntegration).toHaveBeenCalledWith({
      router: mockRouter,
      queryClient: mockQueryClient,
    });
  });

  it('should return router instance', async () => {
    const { getRouter } = await import('../../src/router');

    const router = getRouter();

    expect(router).toBe(mockRouter);
  });

  it('should call getContext before creating router', async () => {
    const { getRouter } = await import('../../src/router');

    // Clear any previous calls
    mockGetContext.mockClear();
    mockCreateRouter.mockClear();

    getRouter();

    // Verify getContext was called before createRouter
    const getContextCallOrder = mockGetContext.mock.invocationCallOrder[0];
    const createRouterCallOrder = mockCreateRouter.mock.invocationCallOrder[0];

    expect(getContextCallOrder).toBeLessThan(createRouterCallOrder);
  });

  it('should call setupRouterSsrQueryIntegration after creating router', async () => {
    const { getRouter } = await import('../../src/router');

    // Clear any previous calls
    mockCreateRouter.mockClear();
    mockSetupRouterSsrQueryIntegration.mockClear();

    getRouter();

    // Verify createRouter was called before setupRouterSsrQueryIntegration
    const createRouterCallOrder = mockCreateRouter.mock.invocationCallOrder[0];
    const setupCallOrder = mockSetupRouterSsrQueryIntegration.mock.invocationCallOrder[0];

    expect(createRouterCallOrder).toBeLessThan(setupCallOrder);
  });

  it('should create a new router instance on each call', async () => {
    const { getRouter } = await import('../../src/router');

    mockCreateRouter.mockClear();

    getRouter();
    getRouter();

    expect(mockCreateRouter).toHaveBeenCalledTimes(2);
  });

  it('should use the same queryClient from context for SSR integration', async () => {
    const { getRouter } = await import('../../src/router');

    const mockContext = {
      queryClient: mockQueryClient,
    };
    mockGetContext.mockReturnValue(mockContext);

    getRouter();

    expect(mockSetupRouterSsrQueryIntegration).toHaveBeenCalledWith({
      router: mockRouter,
      queryClient: mockQueryClient,
    });
  });
});
