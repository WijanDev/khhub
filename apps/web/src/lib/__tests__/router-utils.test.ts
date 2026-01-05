import { describe, it, expect } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import type { RouterContext } from '@tanstack/react-router';
import { getQueryClientFromContext } from '../router-utils';

describe('getQueryClientFromContext', () => {
  it('should return undefined when context is undefined', () => {
    const result = getQueryClientFromContext(undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when context is null', () => {
    const result = getQueryClientFromContext(null as any);
    expect(result).toBeUndefined();
  });

  it('should return undefined when context has no queryClient property', () => {
    const context = {} as RouterContext;
    const result = getQueryClientFromContext(context);
    expect(result).toBeUndefined();
  });

  it('should return undefined when context.queryClient is undefined', () => {
    const context = {
      queryClient: undefined,
    } as RouterContext;
    const result = getQueryClientFromContext(context);
    expect(result).toBeUndefined();
  });

  it('should return undefined when context.queryClient is null', () => {
    const context = {
      queryClient: null,
    } as any;
    const result = getQueryClientFromContext(context);
    expect(result).toBeNull();
  });

  it('should return queryClient when context has queryClient', () => {
    const mockQueryClient = {
      getQueryData: () => {},
      setQueryData: () => {},
      invalidateQueries: () => {},
    } as unknown as QueryClient;

    const context = {
      queryClient: mockQueryClient,
    } as RouterContext;

    const result = getQueryClientFromContext(context);
    expect(result).toBe(mockQueryClient);
  });

  it('should return queryClient when context has multiple properties', () => {
    const mockQueryClient = {
      getQueryData: () => {},
      setQueryData: () => {},
      invalidateQueries: () => {},
    } as unknown as QueryClient;

    const context = {
      queryClient: mockQueryClient,
      otherProperty: 'value',
      anotherProperty: 123,
    } as any;

    const result = getQueryClientFromContext(context);
    expect(result).toBe(mockQueryClient);
  });

  it('should handle context with queryClient and other router properties', () => {
    const mockQueryClient = {
      getQueryData: () => {},
      setQueryData: () => {},
      invalidateQueries: () => {},
    } as unknown as QueryClient;

    const context = {
      queryClient: mockQueryClient,
      location: {
        pathname: '/test',
      },
      params: {},
    } as any;

    const result = getQueryClientFromContext(context);
    expect(result).toBe(mockQueryClient);
  });
});
