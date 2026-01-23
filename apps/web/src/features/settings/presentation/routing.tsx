import { createRoute } from '@tanstack/react-router';
import { appRoute } from '@/features/app/presentation/routing';
export { settingsIndexRoute } from './pages/settings';

export const settingsRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/settings'
});
