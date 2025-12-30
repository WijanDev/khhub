import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="page about-page">
      <h1>About KH Hub</h1>
      <div className="content-card">
        <h2>Technology Stack</h2>
        <ul className="tech-list">
          <li>
            <strong>Frontend:</strong> React 19 with TanStack Start (SSR)
          </li>
          <li>
            <strong>Backend:</strong> Hono with Node.js server adapter
          </li>
          <li>
            <strong>Build Tool:</strong> Vite for both frontend and API
          </li>
          <li>
            <strong>Language:</strong> TypeScript throughout
          </li>
          <li>
            <strong>Package Manager:</strong> npm with workspaces
          </li>
        </ul>
      </div>
      <div className="content-card">
        <h2>Project Structure</h2>
        <pre className="code-block">
{`khhub/
├── apps/
│   ├── api/          # Hono API server
│   └── web/          # TanStack Start SSR webapp
│       └── app/
│           ├── routes/   # File-based routing
│           ├── router.tsx
│           ├── client.tsx
│           └── ssr.tsx
├── packages/         # Shared packages (future)
├── package.json      # Root workspace config
└── tsconfig.base.json`}
        </pre>
      </div>
    </div>
  );
}

