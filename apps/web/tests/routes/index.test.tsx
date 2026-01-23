import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'landing.hero.badge': 'New Release',
    'landing.hero.title': 'Welcome to KH Hub',
    'landing.hero.description': 'A powerful platform for modern applications',
    'nav.getStarted': 'Get Started',
    'landing.features.multiTenant.title': 'Multi-Tenant',
    'landing.features.multiTenant.description': 'Support for multiple tenants',
    'landing.features.dynamicConnections.title': 'Dynamic Connections',
    'landing.features.dynamicConnections.description': 'Connect to databases dynamically',
    'landing.features.cachingLayer.title': 'Caching Layer',
    'landing.features.cachingLayer.description': 'Fast caching for better performance',
    'landing.features.objectStorage.title': 'Object Storage',
    'landing.features.objectStorage.description': 'Store files and objects easily',
    'landing.cta.title': 'Ready to get started?',
    'landing.cta.description': 'Join thousands of developers',
    'landing.cta.button': 'Sign Up Now',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockLoaderData = {
  message: 'API is running',
};

const mockFetchHello = vi.fn().mockResolvedValue(mockLoaderData);
const mockApiHelloGet = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ message: 'API is running' }),
});

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockLoaderData__ = mockLoaderData;
(globalThis as any).__mockFetchHello__ = mockFetchHello;
(globalThis as any).__mockApiHelloGet__ = mockApiHelloGet;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (globalThis as any).__mockT__,
    i18n: (globalThis as any).__mockI18n__,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');

  return {
    createRoute: vi.fn((config: any) => ({
      ...config,
      id: config.path || 'mock-route',
      path: config.path,
      useLoaderData: () => (globalThis as any).__mockLoaderData__,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
      useLoaderData: () => (globalThis as any).__mockLoaderData__,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    }))),
    Link: ({ to, children, className, ...props }: any) => {
      return React.createElement('a', {
        href: to,
        className,
        'data-testid': 'link',
        ...props,
      }, children);
    },
  };
});

// Mock TanStack Start
vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn(() => ({
    handler: vi.fn((fn: any) => {
      // Return the handler function itself, which will call api.hello.$get()
      return fn;
    }),
  })),
}));

// Mock api-client
vi.mock('@/shared/infrastructure/lib/api-client', () => ({
  api: {
    hello: {
      $get: () => (globalThis as any).__mockApiHelloGet__(),
    },
  },
  getApiBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, size, className, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        'data-size': size,
        className,
        ...props,
      }, children);
    },
  };
});

// Mock Card components
vi.mock('@/shared/infrastructure/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 data-testid="card-title" className={className} {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p data-testid="card-description" className={className} {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Badge component
vi.mock('@/shared/infrastructure/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Building2: ({ className }: any) => (
    <svg data-testid="icon-building2" className={className} />
  ),
  Database: ({ className }: any) => (
    <svg data-testid="icon-database" className={className} />
  ),
  Zap: ({ className }: any) => (
    <svg data-testid="icon-zap" className={className} />
  ),
  HardDrive: ({ className }: any) => (
    <svg data-testid="icon-harddrive" className={className} />
  ),
}));

// Import after mocks are set up
import { homeRoute as Route } from '@/features/public/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockLoaderData__ = mockLoaderData;
    (globalThis as any).__mockApiHelloGet__.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'API is running' }),
    });
  });

  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have loader function', () => {
    expect(route.loader).toBeDefined();
    expect(typeof route.loader).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/');
  });

  it('should call fetchHello in loader', async () => {
    (globalThis as any).__mockApiHelloGet__.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'API is running' }),
    });

    const result = await route.loader();

    expect(result).toEqual({ message: 'API is running' });
    expect((globalThis as any).__mockApiHelloGet__).toHaveBeenCalled();
  });

  it('should return error message when API response is not ok', async () => {
    (globalThis as any).__mockApiHelloGet__.mockResolvedValue({
      ok: false,
    });

    const result = await route.loader();

    expect(result).toEqual({ message: 'Failed to connect to API' });
    expect((globalThis as any).__mockApiHelloGet__).toHaveBeenCalled();
  });

  it('should return error message when API call throws', async () => {
    const error = "Network error";
    (globalThis as any).__mockApiHelloGet__.mockRejectedValue(new Error(error));

    const result = await route.loader();

    expect(result).toEqual({ message: `Failed to connect to API. Error: ${error}` });
    expect((globalThis as any).__mockApiHelloGet__).toHaveBeenCalled();
  });
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockLoaderData__ = mockLoaderData;
    (globalThis as any).__mockT__.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'landing.hero.badge': 'New Release',
        'landing.hero.title': 'Welcome to KH Hub',
        'landing.hero.description': 'A powerful platform for modern applications',
        'nav.getStarted': 'Get Started',
        'landing.features.multiTenant.title': 'Multi-Tenant',
        'landing.features.multiTenant.description': 'Support for multiple tenants',
        'landing.features.dynamicConnections.title': 'Dynamic Connections',
        'landing.features.dynamicConnections.description': 'Connect to databases dynamically',
        'landing.features.cachingLayer.title': 'Caching Layer',
        'landing.features.cachingLayer.description': 'Fast caching for better performance',
        'landing.features.objectStorage.title': 'Object Storage',
        'landing.features.objectStorage.description': 'Store files and objects easily',
        'landing.cta.title': 'Ready to get started?',
        'landing.cta.description': 'Join thousands of developers',
        'landing.cta.button': 'Sign Up Now',
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('Welcome to KH Hub')).toBeDefined();
  });

  it('should render hero section badge', () => {
    render(<route.component />);

    const badge = screen.getByText('New Release');
    expect(badge).toBeDefined();
    expect(badge.closest('[data-testid="badge"]')).toBeDefined();
  });

  it('should render hero section title', () => {
    render(<route.component />);

    const title = screen.getByText('Welcome to KH Hub');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-5xl');
  });

  it('should render hero section description', () => {
    render(<route.component />);

    const description = screen.getByText('A powerful platform for modern applications');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should render Get Started button', () => {
    render(<route.component />);

    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).toBeDefined();
    const link = getStartedButton.closest('[data-testid="link"]');
    expect(link?.getAttribute('href')).toBe('/auth/signup');
  });

  it('should render GitHub button', () => {
    render(<route.component />);

    const githubButton = screen.getByText('View on GitHub');
    expect(githubButton).toBeDefined();
    expect(githubButton.getAttribute('href')).toBe('https://github.com');
    expect(githubButton.getAttribute('target')).toBe('_blank');
  });

  it('should render API status card', () => {
    render(<route.component />);

    expect(screen.getByText(/API Status:/)).toBeDefined();
    expect(screen.getByText('API is running')).toBeDefined();
  });

  it('should render API status with correct message from loader data', () => {
    (globalThis as any).__mockLoaderData__ = { message: 'API is running' };

    render(<route.component />);

    const apiStatus = screen.getByText(/API Status:/);
    expect(apiStatus).toBeDefined();
    expect(screen.getByText('API is running')).toBeDefined();
  });

  it('should render API status with error message when API fails', () => {
    (globalThis as any).__mockLoaderData__ = { message: 'Failed to connect to API' };

    render(<route.component />);

    const apiStatus = screen.getByText(/API Status:/);
    expect(apiStatus).toBeDefined();
    expect(screen.getByText('Failed to connect to API')).toBeDefined();
  });

  it('should render all feature cards', () => {
    render(<route.component />);

    expect(screen.getByText('Multi-Tenant')).toBeDefined();
    expect(screen.getByText('Dynamic Connections')).toBeDefined();
    expect(screen.getByText('Caching Layer')).toBeDefined();
    expect(screen.getByText('Object Storage')).toBeDefined();
  });

  it('should render feature descriptions', () => {
    render(<route.component />);

    expect(screen.getByText('Support for multiple tenants')).toBeDefined();
    expect(screen.getByText('Connect to databases dynamically')).toBeDefined();
    expect(screen.getByText('Fast caching for better performance')).toBeDefined();
    expect(screen.getByText('Store files and objects easily')).toBeDefined();
  });

  it('should render feature icons', () => {
    render(<route.component />);

    expect(screen.getByTestId('icon-building2')).toBeDefined();
    expect(screen.getByTestId('icon-database')).toBeDefined();
    expect(screen.getByTestId('icon-zap')).toBeDefined();
    expect(screen.getByTestId('icon-harddrive')).toBeDefined();
  });

  it('should render features in grid layout', () => {
    const { container } = render(<route.component />);

    const gridContainer = container.querySelector('.grid.gap-6');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('sm:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-4');
  });

  it('should render CTA section with title', () => {
    render(<route.component />);

    const ctaTitle = screen.getByText('Ready to get started?');
    expect(ctaTitle).toBeDefined();
    expect(ctaTitle.tagName).toBe('H2');
  });

  it('should render CTA section with description', () => {
    render(<route.component />);

    expect(screen.getByText('Join thousands of developers')).toBeDefined();
  });

  it('should render CTA button', () => {
    render(<route.component />);

    const ctaButton = screen.getByText('Sign Up Now');
    expect(ctaButton).toBeDefined();
    const link = ctaButton.closest('[data-testid="link"]');
    expect(link?.getAttribute('href')).toBe('/auth/signup');
  });

  it('should render CTA section with correct styling', () => {
    const { container } = render(<route.component />);

    const ctaSection = container.querySelector('.rounded-2xl.border');
    expect(ctaSection).toBeDefined();
    expect(ctaSection?.className).toContain('bg-gradient-to-br');
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.hero.badge');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.hero.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.hero.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('nav.getStarted');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.features.multiTenant.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.features.multiTenant.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.cta.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.cta.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('landing.cta.button');
  });

  it('should render hero section with correct classes', () => {
    const { container } = render(<route.component />);

    const heroSection = container.querySelector('section.flex.flex-col');
    expect(heroSection).toBeDefined();
    expect(heroSection?.className).toContain('items-center');
    expect(heroSection?.className).toContain('justify-center');
    expect(heroSection?.className).toContain('text-center');
  });

  it('should render feature cards with hover effects', () => {
    const { container } = render(<route.component />);

    const featureCards = container.querySelectorAll('[data-testid="card"]');
    featureCards.forEach((card) => {
      if (card.className.includes('group')) {
        expect(card.className).toContain('transition-all');
        expect(card.className).toContain('hover:border-primary/30');
      }
    });
  });

  it('should render API status card with animated indicator', () => {
    const { container } = render(<route.component />);

    const apiCard = container.querySelector('[data-testid="card"]');
    const animatedIndicator = apiCard?.querySelector('.animate-ping');
    expect(animatedIndicator).toBeDefined();
  });
});
