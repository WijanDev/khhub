import { useQuery, useSuspenseQuery, type UseQueryResult, type QueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api-client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | null;
  image: string | null;
  emailVerified: boolean | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  users: User[];
}

export interface UserResponse {
  user: User;
}

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: () => [...userKeys.lists()] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Fetch users
async function fetchUsers(): Promise<UsersResponse> {
  const response = await usersApi.$get();
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

// Fetch user by ID
async function fetchUser(id: string): Promise<UserResponse> {
  const response = await usersApi[':id'].$get({ param: { id } });
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// Hook to get all users
export function useUsers(): UseQueryResult<UsersResponse, Error> {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: fetchUsers,
  });
}

// Hook to get a single user
export function useUser(id: string): UseQueryResult<UserResponse, Error> {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

import type { QueryClient } from '@tanstack/react-query';

// Prefetch users (for use in loaders)
export async function prefetchUsers(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: userKeys.list(),
    queryFn: fetchUsers,
  });
}

// Hook to get users with suspense (for use after prefetching)
export function useUsersSuspense() {
  return useSuspenseQuery({
    queryKey: userKeys.list(),
    queryFn: fetchUsers,
  });
}

// Prefetch user by ID (for use in loaders)
export async function prefetchUser(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
  });
}

// Hook to get user with suspense (for use after prefetching)
export function useUserSuspense(id: string) {
  return useSuspenseQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
  });
}

