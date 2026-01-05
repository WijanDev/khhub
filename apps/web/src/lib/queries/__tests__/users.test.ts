import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';

// Create mocks that will be returned from factories
const mockUseQuery = vi.fn();
const mockUseSuspenseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseQueryClient = vi.fn();
const mockPrefetchQuery = vi.fn().mockResolvedValue(undefined);
const mockInvalidateQueries = vi.fn();

const mockUsersApi = {
  $get: vi.fn(),
  ':id': {
    $get: vi.fn(),
    $delete: vi.fn(),
  },
};

const mockQueryClient = {
  prefetchQuery: mockPrefetchQuery,
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: mockInvalidateQueries,
} as unknown as QueryClient;

// Mock usersApi - use factory that returns the mock directly
vi.mock('@/lib/api-client', () => {
  return {
    usersApi: {
      $get: vi.fn(),
      ':id': {
        $get: vi.fn(),
        $delete: vi.fn(),
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
    useMutation: vi.fn(),
    useQueryClient: vi.fn(() => mockQueryClient),
    QueryClient: vi.fn(() => mockQueryClient),
  };
});

// Import after mocks are set up
import {
  userKeys,
  useUsers,
  useUser,
  useUsersSuspense,
  useUserSuspense,
  prefetchUsers,
  prefetchUser,
  useDeleteUser,
  type User,
} from '../users';

// Get the mocked functions after import
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api-client';

describe('userKeys', () => {
  it('should have correct all key', () => {
    expect(userKeys.all).toEqual(['users']);
  });

  it('should generate correct lists key', () => {
    expect(userKeys.lists()).toEqual(['users', 'list']);
  });

  it('should generate correct list key', () => {
    expect(userKeys.list()).toEqual(['users', 'list']);
  });

  it('should generate correct details key', () => {
    expect(userKeys.details()).toEqual(['users', 'detail']);
  });

  it('should generate correct detail key with id', () => {
    expect(userKeys.detail('123')).toEqual(['users', 'detail', '123']);
  });
});

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { users: [] },
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useUsers());

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useQuery with correct parameters when id is provided', () => {
    const mockQueryResult = {
      data: { user: {} as User },
      isLoading: false,
      error: null,
    };

    (useQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useUser('123'));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', '123'],
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

    renderHook(() => useUser(''));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', ''],
      queryFn: expect.any(Function),
      enabled: false,
    });
  });
});

describe('useUsersSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useSuspenseQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { users: [] },
    };

    (useSuspenseQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useUsersSuspense());

    expect(useSuspenseQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useUserSuspense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call useSuspenseQuery with correct parameters', () => {
    const mockQueryResult = {
      data: { user: {} as User },
    };

    (useSuspenseQuery as any).mockReturnValue(mockQueryResult);

    renderHook(() => useUserSuspense('123'));

    expect(useSuspenseQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', '123'],
      queryFn: expect.any(Function),
    });
  });
});

describe('prefetchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefetch users query', async () => {
    await prefetchUsers(mockQueryClient);

    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'list'],
      queryFn: expect.any(Function),
    });
  });
});

describe('prefetchUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefetch user query with id', async () => {
    await prefetchUser(mockQueryClient, '123');

    expect(mockPrefetchQuery).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', '123'],
      queryFn: expect.any(Function),
    });
  });
});

describe('useDeleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateQueries.mockClear();
  });

  it('should call useMutation with deleteUser function', () => {
    const mockMutationResult = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    (useMutation as any).mockReturnValue(mockMutationResult);
    (useQueryClient as any).mockReturnValue(mockQueryClient);

    renderHook(() => useDeleteUser());

    expect(useMutation).toHaveBeenCalled();
    const mutationCall = (useMutation as any).mock.calls[0][0];
    expect(mutationCall.mutationFn).toBeDefined();
    expect(typeof mutationCall.mutationFn).toBe('function');
  });

  it('should invalidate users list on success', () => {
    const mockMutationResult = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    (useMutation as any).mockReturnValue(mockMutationResult);
    (useQueryClient as any).mockReturnValue(mockQueryClient);

    renderHook(() => useDeleteUser());

    const mutationCall = (useMutation as any).mock.calls[0][0];
    
    // Simulate onSuccess callback
    if (mutationCall.onSuccess) {
      mutationCall.onSuccess({ message: 'User deleted', user: { id: '1', email: 'test@example.com', name: 'Test' } });
    }

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['users', 'list'],
    });
  });

  it('should call delete API endpoint with correct id', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: 'User deleted',
        user: { id: '123', email: 'test@example.com', name: 'Test User' },
      }),
    };

    (usersApi[':id'].$delete as any).mockResolvedValue(mockResponse);
    (useQueryClient as any).mockReturnValue(mockQueryClient);

    const mockMutationResult = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    (useMutation as any).mockReturnValue(mockMutationResult);

    renderHook(() => useDeleteUser());

    const mutationCall = (useMutation as any).mock.calls[0][0];
    const deleteFn = mutationCall.mutationFn;

    await deleteFn('123');

    expect(usersApi[':id'].$delete).toHaveBeenCalledWith({ param: { id: '123' } });
  });

  it('should throw error when delete response is not ok', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ message: 'User not found' }),
    };

    (usersApi[':id'].$delete as any).mockResolvedValue(mockResponse);
    (useQueryClient as any).mockReturnValue(mockQueryClient);

    const mockMutationResult = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    (useMutation as any).mockReturnValue(mockMutationResult);

    renderHook(() => useDeleteUser());

    const mutationCall = (useMutation as any).mock.calls[0][0];
    const deleteFn = mutationCall.mutationFn;

    await expect(deleteFn('123')).rejects.toThrow('User not found');
  });

  it('should throw default error message when error response has no message', async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    };

    (usersApi[':id'].$delete as any).mockResolvedValue(mockResponse);
    (useQueryClient as any).mockReturnValue(mockQueryClient);

    const mockMutationResult = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    (useMutation as any).mockReturnValue(mockMutationResult);

    renderHook(() => useDeleteUser());

    const mutationCall = (useMutation as any).mock.calls[0][0];
    const deleteFn = mutationCall.mutationFn;

    await expect(deleteFn('123')).rejects.toThrow('Failed to delete user');
  });
});
