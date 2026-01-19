import { Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/shared/infrastructure/lib/auth-client';

export const authLoader = async () => {
    // If user is already logged in, redirect to app
    const { data: session } = await authClient.getSession();
    if (session) {
        throw redirect({ to: '/app/dashboard' });
    }
};

export function AuthLayout() {
    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
            <Outlet />
        </div>
    );
}
