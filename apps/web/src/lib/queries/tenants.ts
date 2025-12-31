import { useQuery, useSuspenseQuery, type UseQueryResult, type QueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended' | null;
  createdAt: string | null;
  updatedAt: string | null;
  connections?: TenantConnection[];
}

export interface TenantConnection {
  id: string;
  tenantId: string;
  name: string;
  dbType: 'postgresql' | 'mysql' | 'sqlite' | 'd1';
  connectionString: string;
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'error' | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TenantsResponse {
  tenants: Tenant[];
}

export interface TenantResponse {
  tenant: Tenant;
}

export interface TenantConnectionsResponse {
  connections: TenantConnection[];
}

// Query keys
export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: () => [...tenantKeys.lists()] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
  connections: (id: string) => [...tenantKeys.detail(id), 'connections'] as const,
};

// Fetch tenants
async function fetchTenants(): Promise<TenantsResponse> {
  const response = await tenantsApi.$get();
  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }
  return response.json();
}

// Fetch tenant by ID
async function fetchTenant(id: string): Promise<TenantResponse> {
  const response = await tenantsApi[':id'].$get({ param: { id } });
  if (!response.ok) {
    throw new Error('Failed to fetch tenant');
  }
  return response.json();
}

// Fetch tenant connections
async function fetchTenantConnections(id: string): Promise<TenantConnectionsResponse> {
  const response = await tenantsApi[':id'].connections.$get({ param: { id } });
  if (!response.ok) {
    throw new Error('Failed to fetch tenant connections');
  }
  return response.json();
}

// Hook to get all tenants
export function useTenants(): UseQueryResult<TenantsResponse, Error> {
  return useQuery({
    queryKey: tenantKeys.list(),
    queryFn: fetchTenants,
  });
}

// Hook to get a single tenant
export function useTenant(id: string): UseQueryResult<TenantResponse, Error> {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => fetchTenant(id),
    enabled: !!id,
  });
}

// Hook to get tenant connections
export function useTenantConnections(
  id: string
): UseQueryResult<TenantConnectionsResponse, Error> {
  return useQuery({
    queryKey: tenantKeys.connections(id),
    queryFn: () => fetchTenantConnections(id),
    enabled: !!id,
  });
}

// Prefetch tenants (for use in loaders)
export async function prefetchTenants(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: tenantKeys.list(),
    queryFn: fetchTenants,
  });
}

// Hook to get tenants with suspense (for use after prefetching)
export function useTenantsSuspense() {
  return useSuspenseQuery({
    queryKey: tenantKeys.list(),
    queryFn: fetchTenants,
  });
}

// Prefetch tenant by ID (for use in loaders)
export async function prefetchTenant(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => fetchTenant(id),
  });
}

// Hook to get tenant with suspense (for use after prefetching)
export function useTenantSuspense(id: string) {
  return useSuspenseQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => fetchTenant(id),
  });
}

// Prefetch tenant connections (for use in loaders)
export async function prefetchTenantConnections(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: tenantKeys.connections(id),
    queryFn: () => fetchTenantConnections(id),
  });
}

// Hook to get tenant connections with suspense (for use after prefetching)
export function useTenantConnectionsSuspense(id: string) {
  return useSuspenseQuery({
    queryKey: tenantKeys.connections(id),
    queryFn: () => fetchTenantConnections(id),
  });
}

