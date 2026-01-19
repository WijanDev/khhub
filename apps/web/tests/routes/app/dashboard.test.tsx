import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'app.dashboard.title': 'Dashboard',
    'app.dashboard.welcome': `Welcome back, ${options?.name || 'User'}!`,
    'app.dashboard.stats.totalUsers': 'Total Users',
    'app.dashboard.stats.activeTenants': 'Active Tenants',
    'app.dashboard.stats.totalSessions': 'Total Sessions',
    'app.dashboard.stats.growthRate': 'Growth Rate',
    'app.dashboard.fromLastMonth': 'from last month',
    'app.dashboard.recentActivity.title': 'Recent Activity',
    'app.dashboard.recentActivity.description': 'Latest actions across your platform',
    'app.dashboard.quickActions.title': 'Quick Actions',
    'app.dashboard.quickActions.description': 'Common tasks and shortcuts',
    'app.dashboard.quickActions.inviteTeam': 'Invite Team Member',
    'app.dashboard.quickActions.createTenant': 'Create Tenant',
    'app.dashboard.quickActions.viewAnalytics': 'View Analytics',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockSession = {
  data: {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    },
  },
  isPending: false,
};

const mockUseSession = vi.fn().mockReturnValue(mockSession);

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseSession__ = mockUseSession;

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

// Mock auth-client
vi.mock('@/shared/infrastructure/lib/auth-client', () => ({
  useSession: () => (globalThis as any).__mockUseSession__(),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');

  return {
    createRoute: vi.fn((config: any) => ({
      ...config,
      id: config.path || 'mock-route',
      update: function (c: any) { Object.assign(this, c); return this; },
    })),
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
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
  };
});

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, className, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Activity: ({ className }: any) => (
    <svg data-testid="icon-activity" className={className} />
  ),
  Users: ({ className }: any) => (
    <svg data-testid="icon-users" className={className} />
  ),
  Building2: ({ className }: any) => (
    <svg data-testid="icon-building2" className={className} />
  ),
  TrendingUp: ({ className }: any) => (
    <svg data-testid="icon-trending-up" className={className} />
  ),
  ArrowUpRight: ({ className }: any) => (
    <svg data-testid="icon-arrow-up-right" className={className} />
  ),
  ArrowDownRight: ({ className }: any) => (
    <svg data-testid="icon-arrow-down-right" className={className} />
  ),
}));

// Import after mocks are set up
import { dashboardRoute as Route } from '@/features/app/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/dashboard');
  });
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseSession__.mockReturnValue(mockSession);
    (globalThis as any).__mockT__.mockImplementation((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'app.dashboard.title': 'Dashboard',
        'app.dashboard.welcome': `Welcome back, ${options?.name || 'User'}!`,
        'app.dashboard.stats.totalUsers': 'Total Users',
        'app.dashboard.stats.activeTenants': 'Active Tenants',
        'app.dashboard.stats.totalSessions': 'Total Sessions',
        'app.dashboard.stats.growthRate': 'Growth Rate',
        'app.dashboard.fromLastMonth': 'from last month',
        'app.dashboard.recentActivity.title': 'Recent Activity',
        'app.dashboard.recentActivity.description': 'Latest actions across your platform',
        'app.dashboard.quickActions.title': 'Quick Actions',
        'app.dashboard.quickActions.description': 'Common tasks and shortcuts',
        'app.dashboard.quickActions.inviteTeam': 'Invite Team Member',
        'app.dashboard.quickActions.createTenant': 'Create Tenant',
        'app.dashboard.quickActions.viewAnalytics': 'View Analytics',
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('should render header with title', () => {
    render(<route.component />);

    const title = screen.getByText('Dashboard');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-3xl');
  });

  it('should render welcome message with user name', () => {
    render(<route.component />);

    expect(screen.getByText('Welcome back, Test User!')).toBeDefined();
  });

  it('should render welcome message without name when session is null', () => {
    (globalThis as any).__mockUseSession__.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<route.component />);

    expect(screen.getByText('Welcome back, User!')).toBeDefined();
  });

  it('should render all stats cards', () => {
    render(<route.component />);

    expect(screen.getByText('Total Users')).toBeDefined();
    expect(screen.getByText('Active Tenants')).toBeDefined();
    expect(screen.getByText('Total Sessions')).toBeDefined();
    expect(screen.getByText('Growth Rate')).toBeDefined();
  });

  it('should render stat values', () => {
    render(<route.component />);

    expect(screen.getByText('2,543')).toBeDefined();
    expect(screen.getByText('48')).toBeDefined();
    expect(screen.getByText('12,847')).toBeDefined();
    expect(screen.getByText('18.2%')).toBeDefined();
  });

  it('should render stat changes', () => {
    render(<route.component />);

    expect(screen.getByText('+12.5%')).toBeDefined();
    expect(screen.getByText('+4.3%')).toBeDefined();
    expect(screen.getByText('+23.1%')).toBeDefined();
    expect(screen.getByText('-2.4%')).toBeDefined();
  });

  it('should render stat icons', () => {
    render(<route.component />);

    expect(screen.getAllByTestId('icon-users').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('icon-building2').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('icon-activity').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('icon-trending-up').length).toBeGreaterThan(0);
  });

  it('should render up trend arrows for positive trends', () => {
    render(<route.component />);

    const upArrows = screen.getAllByTestId('icon-arrow-up-right');
    expect(upArrows.length).toBe(3); // Three stats with 'up' trend
  });

  it('should render down trend arrow for negative trend', () => {
    render(<route.component />);

    const downArrows = screen.getAllByTestId('icon-arrow-down-right');
    expect(downArrows.length).toBe(1); // One stat with 'down' trend
  });

  it('should render stats in grid layout', () => {
    const { container } = render(<route.component />);

    const gridContainer = container.querySelector('.grid.gap-4');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('md:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-4');
  });

  it('should render "from last month" text for each stat', () => {
    render(<route.component />);

    const fromLastMonthTexts = screen.getAllByText('from last month');
    expect(fromLastMonthTexts.length).toBe(4); // One for each stat
  });

  it('should render recent activity section', () => {
    render(<route.component />);

    expect(screen.getByText('Recent Activity')).toBeDefined();
    expect(screen.getByText('Latest actions across your platform')).toBeDefined();
  });

  it('should render all recent activity items', () => {
    render(<route.component />);

    const newUserRegistered = screen.getAllByText('New user registered');
    expect(newUserRegistered.length).toBe(2); // Appears twice
    expect(screen.getByText('Tenant created')).toBeDefined();
    expect(screen.getByText('Settings updated')).toBeDefined();
    expect(screen.getByText('Database connection added')).toBeDefined();
  });

  it('should render user emails in recent activity', () => {
    render(<route.component />);

    expect(screen.getByText('alice@example.com')).toBeDefined();
    const adminEmails = screen.getAllByText('admin@example.com');
    expect(adminEmails.length).toBe(2); // Appears twice
    expect(screen.getByText('bob@example.com')).toBeDefined();
    expect(screen.getByText('charlie@example.com')).toBeDefined();
  });

  it('should render timestamps in recent activity', () => {
    render(<route.component />);

    expect(screen.getByText('2 minutes ago')).toBeDefined();
    expect(screen.getByText('15 minutes ago')).toBeDefined();
    expect(screen.getByText('1 hour ago')).toBeDefined();
    expect(screen.getByText('2 hours ago')).toBeDefined();
    expect(screen.getByText('3 hours ago')).toBeDefined();
  });

  it('should render quick actions section', () => {
    render(<route.component />);

    expect(screen.getByText('Quick Actions')).toBeDefined();
    expect(screen.getByText('Common tasks and shortcuts')).toBeDefined();
  });

  it('should render all quick action buttons', () => {
    render(<route.component />);

    expect(screen.getByText('Invite Team Member')).toBeDefined();
    expect(screen.getByText('Create Tenant')).toBeDefined();
    expect(screen.getByText('View Analytics')).toBeDefined();
  });

  it('should render quick action buttons with icons', () => {
    render(<route.component />);

    const inviteButton = screen.getByText('Invite Team Member').closest('[data-testid="button"]');
    const createTenantButton = screen.getByText('Create Tenant').closest('[data-testid="button"]');
    const viewAnalyticsButton = screen.getByText('View Analytics').closest('[data-testid="button"]');

    expect(inviteButton?.querySelector('[data-testid="icon-users"]')).toBeDefined();
    expect(createTenantButton?.querySelector('[data-testid="icon-building2"]')).toBeDefined();
    expect(viewAnalyticsButton?.querySelector('[data-testid="icon-activity"]')).toBeDefined();
  });

  it('should render quick action buttons with outline variant', () => {
    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const quickActionButtons = buttons.filter((btn) =>
      btn.getAttribute('data-variant') === 'outline'
    );
    expect(quickActionButtons.length).toBe(3);
  });

  it('should render recent activity and quick actions in grid', () => {
    const { container } = render(<route.component />);

    const grids = container.querySelectorAll('.grid.gap-4');
    const activityGrid = Array.from(grids).find((grid) =>
      grid.className.includes('lg:grid-cols-2')
    );
    expect(activityGrid).toBeDefined();
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.welcome', { name: 'Test User' });
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.stats.totalUsers');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.stats.activeTenants');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.stats.totalSessions');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.stats.growthRate');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.fromLastMonth');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.recentActivity.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.dashboard.quickActions.title');
  });

  it('should use session data for welcome message', () => {
    render(<route.component />);

    expect((globalThis as any).__mockUseSession__).toHaveBeenCalled();
  });

  it('should render stat cards with correct structure', () => {
    const { container } = render(<route.component />);

    const statCards = container.querySelectorAll('[data-testid="card"]');
    // Should have 4 stat cards + 2 section cards (recent activity + quick actions) = 6 total
    expect(statCards.length).toBe(6);
  });

  it('should render stat values with correct styling', () => {
    const { container } = render(<route.component />);

    const statValue = container.querySelector('.text-2xl.font-bold');
    expect(statValue).toBeDefined();
    expect(statValue?.textContent).toBe('2,543');
  });

  it('should render trend indicators with correct colors', () => {
    const { container } = render(<route.component />);

    const greenTexts = container.querySelectorAll('.text-green-500');
    const redTexts = container.querySelectorAll('.text-red-500');

    // Should have 3 green (up trends) and 1 red (down trend) for changes
    expect(greenTexts.length).toBeGreaterThanOrEqual(3);
    expect(redTexts.length).toBeGreaterThanOrEqual(1);
  });
});
