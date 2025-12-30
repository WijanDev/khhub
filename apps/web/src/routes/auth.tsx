import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    // If user is already logged in, redirect to app
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: '/app/dashboard' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <Outlet />
    </div>
  );
}

