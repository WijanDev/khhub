import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockGetSession = vi.fn().mockResolvedValue({ data: null });

const mockAuthClient = {
  getSession: mockGetSession,
};

// Store in globalThis
(globalThis as any).__mockAuthClient__ = mockAuthClient;
(globalThis as any).__mockGetSession__ = mockGetSession;

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: () => (globalThis as any).__mockGetSession__(),
  },
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  
  return {
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
    })),
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content'),
    redirect: vi.fn((config: any) => {
      const error: any = new Error('Redirect');
      error.to = config.to;
      throw error;
    }),
  };
});

// Import after mocks are set up
import { Route } from '../auth';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockGetSession__.mockResolvedValue({ data: null });
  });

  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have beforeLoad function', () => {
    expect(route.beforeLoad).toBeDefined();
    expect(typeof route.beforeLoad).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/auth');
  });

  it('should not redirect when user is not authenticated', async () => {
    (globalThis as any).__mockGetSession__.mockResolvedValue({ data: null });
    
    const result = await route.beforeLoad();
    
    // Should return undefined (no redirect)
    expect(result).toBeUndefined();
    expect((globalThis as any).__mockGetSession__).toHaveBeenCalled();
  });

  it('should redirect when user is authenticated', async () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };
    
    (globalThis as any).__mockGetSession__.mockResolvedValue({ data: mockSession });
    
    // Import redirect to check if it's called
    const { redirect } = await import('@tanstack/react-router');
    
    try {
      await route.beforeLoad();
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Should throw redirect error
      expect(error).toBeDefined();
      expect((globalThis as any).__mockGetSession__).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith({ to: '/app/dashboard' });
    }
  });
});

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component', () => {
    render(<route.component />);
    
    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render Outlet', () => {
    render(<route.component />);
    
    const outlet = screen.getByTestId('outlet');
    expect(outlet).toBeDefined();
    expect(outlet.textContent).toBe('Outlet Content');
  });

  it('should render container with correct classes', () => {
    const { container } = render(<route.component />);
    
    const mainDiv = container.querySelector('div.flex');
    expect(mainDiv).toBeDefined();
    expect(mainDiv?.className).toContain('items-center');
    expect(mainDiv?.className).toContain('justify-center');
    expect(mainDiv?.className).toContain('min-h-[calc(100vh-200px)]');
  });

  it('should render Outlet inside centered container', () => {
    const { container } = render(<route.component />);
    
    const mainDiv = container.querySelector('div.flex');
    const outlet = mainDiv?.querySelector('[data-testid="outlet"]');
    
    expect(mainDiv).toBeDefined();
    expect(outlet).toBeDefined();
  });

  it('should have correct min-height calculation', () => {
    const { container } = render(<route.component />);
    
    const mainDiv = container.querySelector('div.flex');
    expect(mainDiv).toBeDefined();
    expect(mainDiv?.className).toContain('min-h-[calc(100vh-200px)]');
  });

  it('should center content vertically and horizontally', () => {
    const { container } = render(<route.component />);
    
    const mainDiv = container.querySelector('div.flex');
    expect(mainDiv?.className).toContain('flex');
    expect(mainDiv?.className).toContain('items-center');
    expect(mainDiv?.className).toContain('justify-center');
  });
});
