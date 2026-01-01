import { hc } from 'hono/client';
import type { ApiType } from '@khhub/api';

// Get the API base URL based on environment
export function getApiBaseUrl(): string {
  // Check for explicit API URL in environment variables (works in both client and server)
  const apiUrl = 
    (typeof window !== 'undefined' 
      ? (import.meta.env as { VITE_API_URL?: string }).VITE_API_URL
      : process.env.VITE_API_URL || process.env.API_URL);
  
  if (apiUrl) {
    return apiUrl;
  }

  if (typeof window !== 'undefined') {
    // Client-side: use localhost in development, subdomain in production
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8787';
    }
    // Production: use api subdomain
    return `https://api.${window.location.hostname.replace('www.', '')}`;
  }

  // Server-side (SSR): detect development mode
  // In development, use localhost; in production, use subdomain
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.ENVIRONMENT === 'development' ||
                        !process.env.ENVIRONMENT;
  
  if (isDevelopment) {
    return 'http://localhost:8787';
  }
  
  // Production default
  return 'https://api.khhub.app';
}

// Create typed Hono RPC client (no /api prefix - using subdomain)
export const api = hc<ApiType>(getApiBaseUrl(), {
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
export const authApi = api.auth;

// Helper type for extracting response data
export type InferResponse<T> = T extends { json: () => Promise<infer R> } ? R : never;

