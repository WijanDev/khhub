import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '@/shared/presentation/routing/root';
import { AuthLayout, authLoader } from './layout';

export { signInRoute } from './pages/signin';
export { signUpRoute } from './pages/signup';
export { forgotPasswordRoute } from './pages/forgot-password';
export { resetPasswordRoute } from './pages/reset-password';
export { verifyEmailRoute } from './pages/verify-email';

export const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth',
    beforeLoad: authLoader,
    component: AuthLayout,
});
