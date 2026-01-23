import type { QueryClient } from '@tanstack/react-query';
import type { MyRouterContext } from '@/shared/presentation/routing/root';

/**
 * Get the query client from router context
 * This is used in loaders to prefetch data
 */
export function getQueryClientFromContext(
  context: MyRouterContext | undefined
): QueryClient | undefined {
  return context?.queryClient;
}

