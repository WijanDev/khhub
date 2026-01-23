# API Testing Guide

This directory contains test utilities and setup files for the API application.

## Setup

Tests are configured using Vitest. The configuration is in `vitest.config.ts` at the root of the `apps/api` directory.

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Utilities

### Mock KV Namespace

Use `createMockKV()` to create a mock KVNamespace for testing:

```typescript
import { createMockKV } from '../../test/setup';

const mockKV = createMockKV();
const cache = new CacheManager(mockKV);
```

### Mock D1 Database

Use `createMockD1()` to create a mock D1Database for testing:

```typescript
import { createMockD1 } from '../../test/setup';

const mockDB = createMockD1();
```

### Mock Environment

Use `createMockEnv()` to create a complete mock environment:

```typescript
import { createMockEnv } from '../../test/setup';

const env = createMockEnv({
  ENVIRONMENT: 'test',
  // Add other env variables as needed
});
```

## Writing Tests

Tests should be placed next to the files they test, in a `__tests__` directory:

```
src/
  lib/
    cache.ts
    __tests__/
      cache.test.ts
```

Example test:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../cache';
import { createMockKV } from '../../test/setup';

describe('CacheManager', () => {
  let cache: CacheManager;
  let mockKV: KVNamespace;

  beforeEach(() => {
    mockKV = createMockKV();
    cache = new CacheManager(mockKV);
  });

  it('should get and set values', async () => {
    await cache.set('key', { value: 'test' });
    const result = await cache.get('key');
    expect(result).toEqual({ value: 'test' });
  });
});
```

## Best Practices

1. Use `beforeEach` to set up fresh mocks for each test
2. Test both success and error cases
3. Use descriptive test names that explain what is being tested
4. Keep tests isolated - each test should be independent
5. Mock external dependencies (KV, D1, etc.) rather than using real instances
