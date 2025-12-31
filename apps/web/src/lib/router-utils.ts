import type { QueryClient } from '@tanstack/react-query';
import type { RouterContext } from '@tanstack/react-router';

/**
 * Get the query client from router context
 * This is used in loaders to prefetch data
 */
export function getQueryClientFromContext(
  context: RouterContext | undefined
): QueryClient | undefined {
  return context?.queryClient;
}

