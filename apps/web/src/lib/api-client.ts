import { hc } from 'hono/client';
import type { ApiType } from '@khhub/api';

// Get the API base URL based on environment
function getApiBaseUrl(): string {
  // In production, API is on the same origin under /api
  // In development, we might proxy or use a different origin
  if (typeof window !== 'undefined') {
    // Client-side: use relative URL (handled by Vite proxy or same origin)
    return '';
  }
  // Server-side: use environment variable or default
  return '';
}

// Create typed Hono RPC client
export const api = hc<ApiType>(getApiBaseUrl() + '/api', {
  // Include credentials for auth cookies
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: 'include',
    }),
});

// Export individual route clients for convenience
export const tenantsApi = api.tenants;
export const usersApi = api.users;
export const storageApi = api.storage;

// Helper type for extracting response data
export type InferResponse<T> = T extends { json: () => Promise<infer R> } ? R : never;

