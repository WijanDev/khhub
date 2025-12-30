import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
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
        <p>© 2024 KH Hub. Built with Hono + TanStack Router.</p>
      </footer>
    </div>
  );
}

