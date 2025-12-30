import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

const fetchHello = createServerFn().handler(async () => {
  const res = await fetch('http://localhost:3000/api/hello');
  if (!res.ok) {
    return { message: 'Failed to connect to API' };
  }
  return res.json() as Promise<{ message: string }>;
});

export const Route = createFileRoute('/')({
  loader: async () => {
    const data = await fetchHello();
    return data;
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();

  return (
    <div className="page home-page">
      <section className="hero">
        <h1 className="hero-title">Welcome to KH Hub</h1>
        <p className="hero-subtitle">
          A modern monorepo with Hono API and TanStack Start SSR
        </p>
        <div className="api-status">
          <span className="status connected">API: {data.message}</span>
        </div>
      </section>
      <section className="features">
        <div className="feature-card">
          <h3>⚡ Hono API</h3>
          <p>Ultrafast, lightweight backend with Hono running on Node.js</p>
        </div>
        <div className="feature-card">
          <h3>🚀 TanStack Start</h3>
          <p>Full-stack React framework with SSR, streaming, and server functions</p>
        </div>
        <div className="feature-card">
          <h3>📦 Monorepo</h3>
          <p>Organized workspace structure with npm workspaces</p>
        </div>
      </section>
    </div>
  );
}

