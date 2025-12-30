import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { authClient, useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/app')({
  beforeLoad: async () => {
    // Check if user is authenticated
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: '/auth/signin' });
    }
    return { session };
  },
  component: AppLayout,
});

const sidebarLinks = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/tenants', label: 'Tenants', icon: Building2 },
  { to: '/app/users', label: 'Users', icon: Users },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function AppLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/' });
  };

  if (isPending) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-20 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-[73px] z-40 flex h-[calc(100vh-73px)] w-64 flex-col border-r border-border/40 bg-background/95 backdrop-blur-xl transition-transform duration-300 lg:relative lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User info */}
        <div className="border-b border-border/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-medium">{session?.user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map((link) => (
            <Button
              key={link.to}
              variant="ghost"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link
                to={link.to}
                activeProps={{ className: 'bg-accent text-accent-foreground' }}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border/40 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

