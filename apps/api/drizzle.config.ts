import type { Config } from 'drizzle-kit';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Find the local D1 database file created by wrangler
function getLocalD1Path(): string {
  const d1Dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

  if (existsSync(d1Dir)) {
    const files = readdirSync(d1Dir);
    const dbFile = files.find((f) => f.endsWith('.sqlite'));
    if (dbFile) {
      return join(d1Dir, dbFile);
    }
  }

  // Return a placeholder - drizzle-kit will error with a helpful message
  return '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite';
}

const isProduction = !!process.env.CLOUDFLARE_API_TOKEN;

const config: Config = isProduction
  ? {
    schema: './src/shared/infrastructure/db/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    driver: 'd1-http',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
      token: process.env.CLOUDFLARE_API_TOKEN!,
    },
  }
  : {
    schema: './src/shared/infrastructure/db/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    dbCredentials: {
      url: getLocalD1Path(),
    },
  };

export default config;
