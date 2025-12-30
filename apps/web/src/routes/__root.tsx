import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { HeadContent, Scripts } from '@tanstack/react-router';
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
      <body>
        <div className="app">
          <header className="header">
            <nav className="nav">
              <Link to="/" className="logo">
                KH Hub
              </Link>
              <div className="nav-links">
                <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                  Home
                </Link>
                <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                  About
                </Link>
                <Link to="/users" className="nav-link" activeProps={{ className: 'nav-link active' }}>
                  Users
                </Link>
              </div>
            </nav>
          </header>
          <main className="main">
            <Outlet />
          </main>
          <footer className="footer">
            <p>© 2024 KH Hub. Built with Hono + TanStack Start.</p>
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

