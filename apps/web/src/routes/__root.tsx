import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { HeadContent, Scripts } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import stylesUrl from '@/styles/global.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'KH Hub' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' },
      { rel: 'stylesheet', href: stylesUrl },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Background gradient effect */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[100px]" />
        </div>

        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link
                to="/"
                className="bg-gradient-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-xl font-bold tracking-tight text-transparent"
              >
                KH Hub
              </Link>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to="/"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Home
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to="/about"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    About
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to="/users"
                    activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  >
                    Users
                  </Link>
                </Button>
              </div>
            </nav>
          </header>

          {/* Main Content */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} KH Hub. Built with Hono + TanStack Start.</p>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
