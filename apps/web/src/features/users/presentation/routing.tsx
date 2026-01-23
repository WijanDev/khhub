import { createRoute } from '@tanstack/react-router';
import { appRoute } from '@/features/app/presentation/routing';

export { usersIndexRoute } from './pages/users';

export const usersRoute = createRoute({
    getParentRoute: () => appRoute,
    path: '/users',
});