# KH Hub

A modern multi-tenant monorepo featuring a **Hono** API backend and a **TanStack Start** React frontend with SSR.

## 🏗️ Project Structure

```
khhub/
├── apps/
│   ├── api/          # Hono API server (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── routes/       # API route modules
│   │   │   ├── lib/          # Utilities (tenant DB manager)
│   │   │   ├── types.ts      # TypeScript types
│   │   │   └── index.ts      # Main entry point
│   │   └── migrations/       # D1 database migrations
│   └── web/          # TanStack Start SSR webapp
│       └── src/
│           ├── routes/       # File-based routing
│           ├── components/   # UI components (shadcn)
│           ├── styles/
│           ├── router.tsx
│           ├── client.tsx
│           └── ssr.tsx
├── packages/         # Shared packages (for future use)
├── package.json      # Root workspace configuration
└── tsconfig.base.json
```

## 🏢 Multi-Tenant Architecture

This application uses a **central database + tenant databases** architecture:

### Central Database (D1)
- **Users**: Authentication and user profiles
- **Tenants**: Organizations/companies
- **User-Tenant memberships**: Role-based access (owner, admin, member, viewer)
- **Tenant connections**: Connection strings to tenant-specific databases

### Tenant Databases
Each tenant can have multiple database connections:
- **PostgreSQL**, **MySQL**, **SQLite**, or **D1**
- One primary connection per tenant
- Additional connections for analytics, archives, etc.

```
┌─────────────────────────────────────────────────────────┐
│                    Central D1 Database                   │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────────┐ │
│  │  Users  │  │ Tenants │  │   Tenant Connections     │ │
│  └─────────┘  └─────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Tenant A   │ │  Tenant B   │ │  Tenant C   │
    │  PostgreSQL │ │   MySQL     │ │     D1      │
    └─────────────┘ └─────────────┘ └─────────────┘
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
# Start only the API (port 3000 with D1)
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
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Better Auth](https://www.better-auth.com/)** - Authentication with admin plugin
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge runtime
- **[Cloudflare D1](https://developers.cloudflare.com/d1/)** - SQLite database
- **[Cloudflare KV](https://developers.cloudflare.com/kv/)** - Key-value cache
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - S3-compatible object storage
- **TypeScript** - Type safety

### Frontend (`apps/web`)

- **[React 19](https://react.dev/)** - UI library
- **[TanStack Start](https://tanstack.com/start)** - Full-stack React framework with SSR
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing
- **[shadcn/ui](https://ui.shadcn.com/)** - UI components
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Vite](https://vitejs.dev/)** - Build tool and dev server

## 📡 API Endpoints

### Health & Info

| Method | Endpoint   | Description      |
|--------|------------|------------------|
| GET    | `/health`  | Health check     |
| GET    | `/api/hello` | Hello world    |

### Users

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/users`                | List all users           |
| GET    | `/api/users/:id`            | Get user with tenants    |
| POST   | `/api/users`                | Create user              |
| PUT    | `/api/users/:id`            | Update user              |
| DELETE | `/api/users/:id`            | Delete user              |
| POST   | `/api/users/:id/tenants`    | Add user to tenant       |
| PUT    | `/api/users/:id/tenants/:tid` | Update user role       |
| DELETE | `/api/users/:id/tenants/:tid` | Remove from tenant     |

### Tenants

| Method | Endpoint                          | Description           |
|--------|-----------------------------------|-----------------------|
| GET    | `/api/tenants`                    | List all tenants      |
| GET    | `/api/tenants/:id`                | Get tenant + connections |
| POST   | `/api/tenants`                    | Create tenant         |
| PUT    | `/api/tenants/:id`                | Update tenant         |
| DELETE | `/api/tenants/:id`                | Delete tenant         |
| GET    | `/api/tenants/:id/connections`    | List connections      |
| POST   | `/api/tenants/:id/connections`    | Add connection        |
| PUT    | `/api/tenants/:id/connections/:cid` | Update connection   |
| DELETE | `/api/tenants/:id/connections/:cid` | Delete connection   |

## 🗄️ Database (Cloudflare D1 + Drizzle ORM)

The API uses Cloudflare D1 (SQLite) with Drizzle ORM for type-safe database operations.

### Drizzle Schema

Schema is defined in `apps/api/src/db/schema.ts`:

```typescript
import { createDb, users, tenants, userTenants } from './db';

const db = createDb(c.env.DB);

// Query with relations
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { userTenants: { with: { tenant: true } } },
});

// Insert
const [newUser] = await db.insert(users).values({ email, name, passwordHash }).returning();

// Update
await db.update(users).set({ name }).where(eq(users.id, id));

// Delete
await db.delete(users).where(eq(users.id, id));
```

### Tables

| Table | Description |
|-------|-------------|
| `tenants` | Organizations with name, slug, status |
| `tenant_connections` | Database connection strings per tenant |
| `users` | User accounts with authentication |
| `user_tenants` | Role-based membership (owner, admin, member, viewer) |
| `sessions` | Auth token storage |

### Local Development

```bash
# Run migrations locally (first time setup)
cd apps/api
npm run db:migrate

# Start dev server with local D1
npm run dev
```

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate migrations from schema |
| `npm run db:migrate` | Apply migrations to local D1 |
| `npm run db:migrate:prod` | Apply migrations to production D1 |
| `npm run db:studio` | Open Drizzle Studio (GUI) |
| `npm run db:push` | Push schema changes directly |

### Creating a Production D1 Database

1. Create the database:
   ```bash
   wrangler d1 create khhub-db
   ```

2. Copy the `database_id` and update `apps/api/wrangler.json`

3. Apply migrations to production:
   ```bash
   npm run db:migrate:prod
   ```

## ⚡ Caching (Cloudflare KV)

The API uses Cloudflare KV for caching frequently accessed data.

### Cache Strategy

- **GET endpoints** are cached using the cache-aside pattern
- **Mutations** (POST/PUT/DELETE) automatically invalidate relevant caches
- Cache keys are prefixed and structured for easy invalidation

### TTL Presets

| Preset | Duration | Use Case |
|--------|----------|----------|
| `SHORT` | 1 min | Real-time data |
| `DEFAULT` | 5 min | User/tenant details |
| `MEDIUM` | 15 min | List endpoints |
| `LONG` | 1 hour | Connection configs |
| `SESSION` | 7 days | Auth sessions |

### Creating a Production KV Namespace

1. Create the namespace:
   ```bash
   wrangler kv namespace create CACHE
   ```

2. Copy the `id` and update `apps/api/wrangler.json`:
   ```json
   "kv_namespaces": [
     { "binding": "CACHE", "id": "YOUR_KV_NAMESPACE_ID" }
   ]
   ```

### Cache Utilities

```typescript
import { createCacheManager, CacheKeys, CacheTTL } from './lib/cache';

const cache = createCacheManager(c.env.CACHE);

// Get or set (cache-aside pattern)
const data = await cache.getOrSet(
  CacheKeys.user(userId),
  async () => fetchFromDB(),
  { ttl: CacheTTL.DEFAULT }
);

// Manual invalidation
await cache.delete(CacheKeys.user(userId));
await cache.invalidateTenant(tenantId);
```

## 📁 Object Storage (Cloudflare R2)

The API uses Cloudflare R2 (S3-compatible) for file storage.

### Storage Features

- **Tenant isolation** - Files organized by tenant
- **User avatars** - Profile picture storage
- **File validation** - Type and size checks
- **Streaming downloads** - Efficient file delivery

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/storage/tenants/:id/files` | Upload file to tenant |
| GET | `/api/storage/tenants/:id/files` | List tenant files |
| GET | `/api/storage/files/*` | Download file |
| DELETE | `/api/storage/files/*` | Delete file |
| POST | `/api/storage/users/:id/avatar` | Upload user avatar |
| GET | `/api/storage/users/:id/avatar` | Get user avatar |
| DELETE | `/api/storage/users/:id/avatar` | Delete user avatar |

### File Organization

```
khhub-storage/
├── tenants/
│   └── {tenant-id}/
│       ├── files/
│       └── avatar
├── users/
│   └── {user-id}/
│       ├── files/
│       └── avatar
├── public/
└── temp/
```

### Creating a Production R2 Bucket

1. Create the bucket:
   ```bash
   wrangler r2 bucket create khhub-storage
   ```

2. The bucket is already configured in `apps/api/wrangler.json`

### Storage Utilities

```typescript
import { createStorageManager, StoragePaths, MaxFileSizes } from './lib/storage';

const storage = createStorageManager(c.env.STORAGE);

// Upload file
const result = await storage.upload('path/to/file.pdf', fileData, {
  contentType: 'application/pdf',
  metadata: { uploadedBy: userId },
});

// Download file
const file = await storage.download('path/to/file.pdf');

// List files
const files = await storage.list({ prefix: 'tenants/123/', limit: 50 });

// Delete file
await storage.delete('path/to/file.pdf');
```

### File Size Limits

| Type | Max Size |
|------|----------|
| Avatar | 5 MB |
| Image | 10 MB |
| Document | 50 MB |
| Default | 100 MB |

## 🔗 URLs

- **API**: http://localhost:3000
- **Webapp**: http://localhost:5173

The webapp proxies `/api` requests to the API server during development.

## 📦 Adding Shared Packages

Create shared code in `packages/`:

```bash
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

## ☁️ Cloudflare Deployment

This project is configured for Cloudflare Git integration (auto-deploy on push).

- **API** → Cloudflare Workers
- **Web** → Cloudflare Pages

### Setup API (Cloudflare Workers)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
2. Click **Create** → **Import from Git**
3. Connect your repository
4. Configure:
   - **Name**: `khhub-api`
   - **Production branch**: `main`
   - **Root directory**: `apps/api`
   - **Build command**: _(leave empty)_

### Setup Web (Cloudflare Pages)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages
2. Click **Create** → **Import from Git**
3. Connect your repository
4. Configure:
   - **Name**: `khhub-web`
   - **Production branch**: `main`
   - **Root directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/client`

### D1 Database Binding

After creating the D1 database, bind it to your Worker:
1. Go to Worker settings → Variables
2. Under D1 Database Bindings, add:
   - Variable name: `DB`
   - Database: `khhub-db`

## License

MIT
