import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/')({
  beforeLoad: () => {
    // Redirect /app to /app/dashboard
    throw redirect({ to: '/app/dashboard' });
  },
});

