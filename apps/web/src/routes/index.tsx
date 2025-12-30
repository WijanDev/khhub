import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => {
        setApiMessage(data.message);
        setLoading(false);
      })
      .catch(() => {
        setApiMessage('Failed to connect to API');
        setLoading(false);
      });
  }, []);

  return (
    <div className="page home-page">
      <section className="hero">
        <h1 className="hero-title">Welcome to KH Hub</h1>
        <p className="hero-subtitle">
          A modern monorepo with Hono API and TanStack Router
        </p>
        <div className="api-status">
          {loading ? (
            <span className="status loading">Connecting to API...</span>
          ) : (
            <span className="status connected">API: {apiMessage}</span>
          )}
        </div>
      </section>
      <section className="features">
        <div className="feature-card">
          <h3>⚡ Hono API</h3>
          <p>Ultrafast, lightweight backend with Hono running on Node.js</p>
        </div>
        <div className="feature-card">
          <h3>🚀 TanStack Router</h3>
          <p>Type-safe client-side routing with automatic code splitting</p>
        </div>
        <div className="feature-card">
          <h3>📦 Monorepo</h3>
          <p>Organized workspace structure with npm workspaces</p>
        </div>
      </section>
    </div>
  );
}

