import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from '@/shared/presentation/routing/root';
import { AppLayout, appLoader } from './layout';
export { dashboardRoute } from './pages/dashboard';

export const appRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/app',
    beforeLoad: appLoader,
    component: AppLayout,
});

export const appIndexRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/',
    beforeLoad: () => {
        throw redirect({
            to: '/app/dashboard',
        });
    },
});