import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'app.tenants.title': 'Tenants',
    'app.tenants.description': 'Manage your tenants',
    'app.tenants.create': 'Create Tenant',
    'app.tenants.createFirst': 'Create Your First Tenant',
    'app.tenants.empty': 'No tenants found',
    'app.tenants.createdAt': `Created ${options?.date || 'N/A'}`,
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockTenantsData = {
  tenants: [
    {
      id: 1,
      name: 'Tenant 1',
      slug: 'tenant-1',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Tenant 2',
      slug: 'tenant-2',
      status: 'suspended',
      createdAt: '2024-01-02T00:00:00Z',
    },
    {
      id: 3,
      name: 'Tenant 3',
      slug: 'tenant-3',
      status: 'pending',
      createdAt: '2024-01-03T00:00:00Z',
    },
  ],
};

const mockUseTenantsSuspense = vi.fn().mockReturnValue({
  data: mockTenantsData,
});

const mockQueryClient = {
  invalidateQueries: vi.fn(),
};

const mockUseQueryClient = vi.fn().mockReturnValue(mockQueryClient);

const mockPrefetchTenants = vi.fn().mockResolvedValue(undefined);

const mockGetQueryClientFromContext = vi.fn().mockReturnValue(mockQueryClient);

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseTenantsSuspense__ = mockUseTenantsSuspense;
(globalThis as any).__mockUseQueryClient__ = mockUseQueryClient;
(globalThis as any).__mockPrefetchTenants__ = mockPrefetchTenants;
(globalThis as any).__mockGetQueryClientFromContext__ = mockGetQueryClientFromContext;
(globalThis as any).__mockQueryClient__ = mockQueryClient;

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
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createRoute: vi.fn((config: any) => ({
      ...config,
      id: config.path || 'mock-route',
      update: function (c: any) { Object.assign(this, c); return this; },
    })),
    createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    }))),
  };
});

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => (globalThis as any).__mockUseQueryClient__(),
}));

// Mock tenants queries
vi.mock('@/shared/infrastructure/lib/queries/tenants', () => ({
  useTenantsSuspense: () => (globalThis as any).__mockUseTenantsSuspense__(),
  prefetchTenants: (queryClient: any) => (globalThis as any).__mockPrefetchTenants__(queryClient),
  tenantKeys: {
    list: vi.fn(() => ['tenants']),
  },
}));

// Mock router-utils
vi.mock('@/shared/infrastructure/lib/router-utils', () => ({
  getQueryClientFromContext: (context: any) => (globalThis as any).__mockGetQueryClientFromContext__(context),
}));

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, size, className, onClick, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        'data-size': size,
        className,
        onClick,
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Building2: ({ className }: any) => (
    <svg data-testid="icon-building2" className={className} />
  ),
  Plus: ({ className }: any) => (
    <svg data-testid="icon-plus" className={className} />
  ),
  RefreshCw: ({ className }: any) => (
    <svg data-testid="icon-refresh-cw" className={className} />
  ),
  AlertCircle: ({ className }: any) => (
    <svg data-testid="icon-alert-circle" className={className} />
  ),
}));

// Import after mocks are set up
import { tenantsIndexRoute as Route } from '@/features/tenants/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockGetQueryClientFromContext__.mockReturnValue(mockQueryClient);
    (globalThis as any).__mockPrefetchTenants__.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/');
  });


});

describe('TenantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: mockTenantsData,
    });
    (globalThis as any).__mockUseQueryClient__.mockReturnValue(mockQueryClient);
    (globalThis as any).__mockT__.mockImplementation((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'app.tenants.title': 'Tenants',
        'app.tenants.description': 'Manage your tenants',
        'app.tenants.create': 'Create Tenant',
        'app.tenants.createFirst': 'Create Your First Tenant',
        'app.tenants.empty': 'No tenants found',
        'app.tenants.createdAt': `Created ${options?.date || 'N/A'}`,
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('Tenants')).toBeDefined();
  });

  it('should render header with title', () => {
    render(<route.component />);

    const title = screen.getByText('Tenants');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-3xl');
  });

  it('should render header with description', () => {
    render(<route.component />);

    const description = screen.getByText('Manage your tenants');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should render refresh button', () => {
    render(<route.component />);

    const refreshButton = screen.getByTestId('icon-refresh-cw').closest('[data-testid="button"]');
    expect(refreshButton).toBeDefined();
    expect(refreshButton?.getAttribute('data-variant')).toBe('outline');
    expect(refreshButton?.getAttribute('data-size')).toBe('icon');
  });

  it('should render create button', () => {
    render(<route.component />);

    const createButton = screen.getByText('Create Tenant');
    expect(createButton).toBeDefined();
    expect(createButton.closest('[data-testid="button"]')).toBeDefined();
  });

  it('should call invalidateQueries when refresh button is clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(<route.component />);

    const refreshButton = screen.getByTestId('icon-refresh-cw').closest('[data-testid="button"]');
    expect(refreshButton).toBeDefined();

    if (refreshButton) {
      await user.click(refreshButton);
      expect((globalThis as any).__mockQueryClient__.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['tenants'],
      });
    }
  });

  it('should render tenants grid when tenants exist', () => {
    render(<route.component />);

    expect(screen.getByText('Tenant 1')).toBeDefined();
    expect(screen.getByText('Tenant 2')).toBeDefined();
    expect(screen.getByText('Tenant 3')).toBeDefined();
  });

  it('should render tenant slugs', () => {
    render(<route.component />);

    expect(screen.getByText('/tenant-1')).toBeDefined();
    expect(screen.getByText('/tenant-2')).toBeDefined();
    expect(screen.getByText('/tenant-3')).toBeDefined();
  });

  it('should render tenant status badges', () => {
    render(<route.component />);

    expect(screen.getByText('active')).toBeDefined();
    expect(screen.getByText('suspended')).toBeDefined();
    expect(screen.getByText('pending')).toBeDefined();
  });

  it('should render tenant created dates', () => {
    render(<route.component />);

    // The dates are formatted using toLocaleDateString, so we check for the pattern
    const createdTexts = screen.getAllByText(/Created/);
    expect(createdTexts.length).toBe(3);
  });

  it('should render N/A when createdAt is null', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: {
        tenants: [
          {
            id: 5,
            name: 'Tenant 5',
            slug: 'tenant-5',
            status: 'active',
            createdAt: null,
          },
        ],
      },
    });

    render(<route.component />);

    expect(screen.getByText(/Created N\/A/)).toBeDefined();
  });

  it('should render tenant cards with building icons', () => {
    render(<route.component />);

    const buildingIcons = screen.getAllByTestId('icon-building2');
    expect(buildingIcons.length).toBeGreaterThanOrEqual(3);
  });

  it('should render tenants in grid layout', () => {
    const { container } = render(<route.component />);

    const gridContainer = container.querySelector('.grid.gap-4');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('md:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-3');
  });

  it('should render empty state when no tenants', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: { tenants: [] },
    });

    render(<route.component />);

    expect(screen.getByText('No tenants found')).toBeDefined();
    expect(screen.getByText('Create Your First Tenant')).toBeDefined();
  });

  it('should render empty state icon', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: { tenants: [] },
    });

    render(<route.component />);

    const emptyStateIcon = screen.getByTestId('icon-building2');
    expect(emptyStateIcon).toBeDefined();
  });

  it('should not render tenants grid when empty', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: { tenants: [] },
    });

    const { container } = render(<route.component />);

    const gridContainer = container.querySelector('.grid.gap-4');
    expect(gridContainer).toBeNull();
  });

  it('should render tenant cards with correct structure', () => {
    const { container } = render(<route.component />);

    const tenantCards = container.querySelectorAll('[data-testid="card"]');
    expect(tenantCards.length).toBe(3);
  });

  it('should render tenant cards with hover effects', () => {
    const { container } = render(<route.component />);

    const tenantCards = container.querySelectorAll('[data-testid="card"]');
    tenantCards.forEach((card) => {
      expect(card.className).toContain('hover:border-primary/50');
      expect(card.className).toContain('transition-colors');
    });
  });

  it('should render status badges with correct colors for active status', () => {
    const { container } = render(<route.component />);

    const activeBadge = container.querySelector('.bg-green-500\\/10.text-green-500');
    expect(activeBadge).toBeDefined();
    expect(activeBadge?.textContent).toBe('active');
  });

  it('should render status badges with correct colors for suspended status', () => {
    const { container } = render(<route.component />);

    const suspendedBadge = container.querySelector('.bg-red-500\\/10.text-red-500');
    expect(suspendedBadge).toBeDefined();
    expect(suspendedBadge?.textContent).toBe('suspended');
  });

  it('should render status badges with correct colors for pending status', () => {
    const { container } = render(<route.component />);

    const pendingBadge = container.querySelector('.bg-yellow-500\\/10.text-yellow-500');
    expect(pendingBadge).toBeDefined();
    expect(pendingBadge?.textContent).toBe('pending');
  });

  it('should render status badge with default active when status is null', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: {
        tenants: [
          {
            id: 4,
            name: 'Tenant 4',
            slug: 'tenant-4',
            status: null,
            createdAt: '2024-01-04T00:00:00Z',
          },
        ],
      },
    });

    render(<route.component />);

    expect(screen.getByText('active')).toBeDefined();
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.tenants.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.tenants.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.tenants.create');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.tenants.createdAt', expect.any(Object));
  });

  it('should use useTenantsSuspense hook', () => {
    render(<route.component />);

    expect((globalThis as any).__mockUseTenantsSuspense__).toHaveBeenCalled();
  });

  it('should use useQueryClient hook', () => {
    render(<route.component />);

    expect((globalThis as any).__mockUseQueryClient__).toHaveBeenCalled();
  });

  it('should render header with flex layout', () => {
    const { container } = render(<route.component />);

    const header = container.querySelector('.flex.items-center.justify-between');
    expect(header).toBeDefined();
  });

  it('should render create button with plus icon', () => {
    render(<route.component />);

    const createButton = screen.getByText('Create Tenant').closest('[data-testid="button"]');
    const plusIcon = createButton?.querySelector('[data-testid="icon-plus"]');
    expect(plusIcon).toBeDefined();
  });

  it('should render create first button in empty state with plus icon', () => {
    (globalThis as any).__mockUseTenantsSuspense__.mockReturnValue({
      data: { tenants: [] },
    });

    render(<route.component />);

    const createFirstButton = screen.getByText('Create Your First Tenant').closest('[data-testid="button"]');
    const plusIcon = createFirstButton?.querySelector('[data-testid="icon-plus"]');
    expect(plusIcon).toBeDefined();
  });
});
