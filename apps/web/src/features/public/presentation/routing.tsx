import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/shared/presentation/routing/root';
import { PublicLayout } from './ui/public-layout';
export { homeRoute } from './pages/home';
export { aboutRoute } from './pages/about';

export const publicRouting = createRoute({
    id: '_public',
    getParentRoute: () => rootRoute,
    component: PublicLayout,
});