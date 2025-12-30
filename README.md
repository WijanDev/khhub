# KH Hub

A modern monorepo featuring a **Hono** API backend and a **TanStack Router** React frontend.

## 🏗️ Project Structure

```
khhub/
├── apps/
│   ├── api/          # Hono API server (Node.js)
│   │   └── src/
│   │       └── index.ts
│   └── web/          # React webapp with TanStack Router
│       └── src/
│           ├── routes/
│           ├── styles/
│           └── main.tsx
├── packages/         # Shared packages (for future use)
├── package.json      # Root workspace configuration
└── tsconfig.base.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Installation

```bash
# Install all dependencies (from root)
npm install
```

### Development

Run both API and webapp simultaneously:

```bash
# Start all apps in development mode
npm run dev
```

Or run individually:

```bash
# Start only the API (port 3000)
npm run dev:api

# Start only the webapp (port 5173)
npm run dev:web
```

### Building

```bash
# Build all apps
npm run build

# Or build individually
npm run build:api
npm run build:web
```

## 🔧 Technology Stack

### Backend (`apps/api`)

- **[Hono](https://hono.dev/)** - Ultrafast web framework
- **[@hono/node-server](https://hono.dev/getting-started/nodejs)** - Node.js adapter
- **TypeScript** - Type safety
- **tsx** - Development with hot reload
- **tsup** - Build tool

### Frontend (`apps/web`)

- **[React 18](https://react.dev/)** - UI library
- **[TanStack Router](https://tanstack.com/router)** - Type-safe client-side routing
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **TypeScript** - Type safety

## 📡 API Endpoints

| Method | Endpoint       | Description           |
|--------|----------------|-----------------------|
| GET    | `/health`      | Health check          |
| GET    | `/api/hello`   | Hello world message   |
| GET    | `/api/users`   | List all users        |
| POST   | `/api/users`   | Create a new user     |

## 🔗 URLs

- **API**: http://localhost:3000
- **Webapp**: http://localhost:5173

The webapp proxies `/api` requests to the API server during development.

## 📦 Adding Shared Packages

Create shared code in `packages/`:

```bash
# Example: Create a shared types package
mkdir -p packages/shared
cd packages/shared
npm init -y
```

Then import in apps:

```typescript
import { SomeType } from '@khhub/shared';
```

## 🧹 Scripts

| Script            | Description                    |
|-------------------|--------------------------------|
| `npm run dev`     | Start all apps in dev mode     |
| `npm run dev:api` | Start API only                 |
| `npm run dev:web` | Start webapp only              |
| `npm run build`   | Build all apps                 |
| `npm run lint`    | Lint all apps                  |
| `npm run typecheck` | Type check all apps          |

## License

MIT

