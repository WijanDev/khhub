import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';

// Create mocks that will be returned from factories
const mockUseQuery = vi.fn();
const mockUseSuspenseQuery = vi.fn();
const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);

const mockTenantsApi = {
  $get: vi.fn(),
  ':id': {
    $get: vi.fn(),
    connections: {
      $get: vi.fn(),
    },
  },
};

const mockQueryClient = {
  prefetchQuery: mockPrefetchQuery,
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
} as unknown as QueryClient;

// Mock tenantsApi - use factory that returns the mock directly
vi.mock('@/lib/api-client', () => {
  return {
    tenantsApi: {
      $get: vi.fn(),
      ':id': {
        $get: vi.fn(),
        connections: {
          $get: vi.fn(),
        },
      },
    },
  };
});

// Mock React Query - use factory that returns mocks directly
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useSuspenseQuery: vi.fn(),
    QueryClient: vi.fn(() => mockQueryClient),
  };
});

// Import after mocks are set up
import {
  tenantKeys,
  useTenants,
  useTenant,
  useTenantConnections,
  useTenantsSuspense,
  useTenantSuspense,
  useTenantConnectionsSuspense,
  prefetchTenants,
  prefetchTenant,
  prefetchTenantConnections,
  type Tenant,
} from '../tenants';

// Get the mocked functions after import
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api-client';

describe('tenantKeys', () => {
  it('should have correct all key', () => {
    expect(tenantKeys.all).toEqual(['tenants']);
  });

  it('should generate correct lists key', () => {
    expect(tenantKeys.lists()).toEqual(['tenants', 'list']);
  });

  it('should generate correct list key', () => {
    expect(tenantKeys.list()).toEqual(['tenants', 'list']);
  });

  it('should generate correct details key', () => {
    expect(tenantKeys.details()).toEqual(['tenants', 'detail']);
  });

  it('should generate correct detail key with id', () => {
    expect(tenantKeys.detail('123')).toEqual(['tenants', 'detail', '123']);
  });

  it('should generate correct connections key with id', () => {
    expect(tenantKeys.connections('123')).toEqual(['tenants', 'detail', '123', 'connections']);
  });
});

describe('useTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { tenants: [] },
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenants());

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useQuery with correct parameters when id is provided', () => {
    const mockQueryResult = {
      data: { tenant: {} as Tenant },
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenant('123'));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123'],
      queryFn: expect.any(Function),
      enabled: true,
    });
  });

  it('should disable query when id is empty', () => {
    const mockQueryResult = {
      data: undefined,
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenant(''));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', ''],
      queryFn: expect.any(Function),
      enabled: false,
    });
  });
});

describe('useTenantConnections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useQuery with correct parameters when id is provided', () => {
    const mockQueryResult = {
      data: { connections: [] },
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenantConnections('123'));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123', 'connections'],
      queryFn: expect.any(Function),
      enabled: true,
    });
  });

  it('should disable query when id is empty', () => {
    const mockQueryResult = {
      data: undefined,
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenantConnections(''));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '', 'connections'],
      queryFn: expect.any(Function),
      enabled: false,
    });
  });
});

describe('useTenantsSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useSuspenseQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { tenants: [] },
    };

    (useSuspenseQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenantsSuspense());

    expect(useSuspenseQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useTenantSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useSuspenseQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { tenant: {} as Tenant },
    };

    (useSuspenseQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenantSuspense('123'));

    expect(useSuspenseQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useTenantConnectionsSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useSuspenseQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { connections: [] },
    };

    (useSuspenseQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useTenantConnectionsSuspense('123'));

    expect(useSuspenseQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123', 'connections'],
      queryFn: expect.any(Function),
    });
  });
});

describe('prefetchTenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefetch tenants query', async () => {
    await prefetchTenants(mockQueryClient);

    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('prefetchTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefetch tenant query with id', async () => {
    await prefetchTenant(mockQueryClient, '123');

    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123'],
      queryFn: expect.any(Function),
    });
  });
});

describe('prefetchTenantConnections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefetch tenant connections query with id', async () => {
    await prefetchTenantConnections(mockQueryClient, '123');

    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['tenants', 'detail', '123', 'connections'],
      queryFn: expect.any(Function),
    });
  });
});
