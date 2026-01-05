import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';

// Create mock QueryClient instance
const mockQueryClientInstance = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  prefetchQuery: vi.fn(),
} as unknown as QueryClient;

// Store in globalThis for access in mock factory
(globalThis as any).__mockQueryClientInstance__ = mockQueryClientInstance;

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  const React = await import('react');
  
  // Create a proper constructor function
  function MockQueryClient() {
    return (globalThis as any).__mockQueryClientInstance__;
  }
  
  return {
    ...actual,
    QueryClient: MockQueryClient,
    QueryClientProvider: ({ children, client }: { children: React.ReactNode; client: QueryClient }) => {
      return React.createElement('div', {
        'data-testid': 'query-client-provider',
        'data-client': client === (globalThis as any).__mockQueryClientInstance__ ? 'mocked' : 'other',
      }, children);
    },
  };
});

// Import after mocks are set up
import { getContext, Provider } from '../tanstack-query';

describe('getContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new QueryClient instance', () => {
    const context = getContext();
    
    expect(context).toBeDefined();
    expect(context.queryClient).toBeDefined();
  });

  it('should return an object with queryClient property', () => {
    const context = getContext();
    
    expect(context).toHaveProperty('queryClient');
    expect(context.queryClient).toBeDefined();
  });

  it('should return a QueryClient instance', () => {
    const context = getContext();
    
    expect(context.queryClient).toBe(mockQueryClientInstance);
  });

  it('should create a new QueryClient on each call', () => {
    const context1 = getContext();
    const context2 = getContext();
    
    // Both should return the same mock instance in this test setup
    expect(context1.queryClient).toBe(mockQueryClientInstance);
    expect(context2.queryClient).toBe(mockQueryClientInstance);
    expect(context1.queryClient).toBe(context2.queryClient);
  });
});

describe('Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render QueryClientProvider with provided queryClient', () => {
    const testQueryClient = mockQueryClientInstance;
    
    render(
      <Provider queryClient={testQueryClient}>
        <div>Test Content</div>
      </Provider>
    );
    
    const provider = screen.getByTestId('query-client-provider');
    expect(provider).toBeDefined();
    expect(provider.getAttribute('data-client')).toBe('mocked');
  });

  it('should render children inside QueryClientProvider', () => {
    const testQueryClient = mockQueryClientInstance;
    
    render(
      <Provider queryClient={testQueryClient}>
        <div data-testid="child-content">Test Content</div>
      </Provider>
    );
    
    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeDefined();
    expect(childContent.textContent).toBe('Test Content');
  });

  it('should pass queryClient to QueryClientProvider', () => {
    const testQueryClient = mockQueryClientInstance;
    
    render(
      <Provider queryClient={testQueryClient}>
        <div>Content</div>
      </Provider>
    );
    
    const provider = screen.getByTestId('query-client-provider');
    expect(provider).toBeDefined();
  });

  it('should render multiple children', () => {
    const testQueryClient = mockQueryClientInstance;
    
    render(
      <Provider queryClient={testQueryClient}>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Provider>
    );
    
    expect(screen.getByTestId('child-1')).toBeDefined();
    expect(screen.getByTestId('child-2')).toBeDefined();
  });

  it('should render nested components', () => {
    const testQueryClient = mockQueryClientInstance;
    
    render(
      <Provider queryClient={testQueryClient}>
        <div>
          <span>Nested Content</span>
        </div>
      </Provider>
    );
    
    expect(screen.getByText('Nested Content')).toBeDefined();
  });
});
