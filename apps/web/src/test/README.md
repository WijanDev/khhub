# Web Testing Guide

This directory contains test utilities and setup files for the web application.

## Setup

Tests are configured using Vitest with React Testing Library. The configuration is in `vitest.config.ts` at the root of the `apps/web` directory.

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

The test setup includes:
- `@testing-library/react` for React component testing
- `@testing-library/jest-dom` for DOM matchers
- `@testing-library/user-event` for user interaction simulation
- `jsdom` environment for DOM simulation

## Writing Tests

Tests should be placed next to the files they test, in a `__tests__` directory:

```
src/
  components/
    ui/
      button.tsx
      __tests__/
        button.test.tsx
```

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Available Matchers

Thanks to `@testing-library/jest-dom`, you can use matchers like:
- `toBeInTheDocument()`
- `toHaveClass()`
- `toHaveAttribute()`
- `toBeDisabled()`
- `toBeVisible()`
- And more...

## Best Practices

1. Use `render` from `@testing-library/react` to render components
2. Use `screen` queries to find elements (prefer `getByRole`, `getByLabelText`, etc.)
3. Use `userEvent` for simulating user interactions
4. Test user-facing behavior, not implementation details
5. Use descriptive test names
6. Keep tests isolated and independent
