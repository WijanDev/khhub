import { createRoute } from '@tanstack/react-router';
import { appRoute } from '@/features/app/presentation/routing';
export { tenantsIndexRoute } from './pages/tenants';

export const tenantsRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/tenants',
});
