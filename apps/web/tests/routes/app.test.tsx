import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'app.sidebar.dashboard': 'Dashboard',
    'app.sidebar.tenants': 'Tenants',
    'app.sidebar.users': 'Users',
    'app.sidebar.settings': 'Settings',
    'nav.signOut': 'Sign Out',
    'common.loading': 'Loading...',
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

const mockSignOut = vi.fn().mockResolvedValue(undefined);

const mockNavigate = vi.fn();

const mockGetSession = vi.fn().mockResolvedValue(mockSession);

const mockAuthClient = {
  getSession: mockGetSession,
};

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseSession__ = mockUseSession;
(globalThis as any).__mockSignOut__ = mockSignOut;
(globalThis as any).__mockNavigate__ = mockNavigate;
(globalThis as any).__mockAuthClient__ = mockAuthClient;
(globalThis as any).__mockGetSession__ = mockGetSession;

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
  authClient: {
    getSession: () => (globalThis as any).__mockGetSession__(),
  },
  useSession: () => (globalThis as any).__mockUseSession__(),
  signOut: () => (globalThis as any).__mockSignOut__(),
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
    Link: ({ to, children, className, activeProps, onClick, ...props }: any) => {
      return React.createElement('a', {
        href: to,
        className,
        'data-testid': 'link',
        onClick: (e: any) => {
          e.preventDefault();
          onClick?.(e);
        },
        ...props,
      }, children);
    },
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content'),
    redirect: vi.fn((config: any) => {
      const error: any = new Error('Redirect');
      error.to = config.to;
      throw error;
    }),
    useNavigate: () => (globalThis as any).__mockNavigate__,
  };
});

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, size, className, onClick, asChild, ...props }: any) => {
      if (asChild) {
        return children;
      }
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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: ({ className }: any) => (
    <svg data-testid="icon-layout-dashboard" className={className} />
  ),
  Users: ({ className }: any) => (
    <svg data-testid="icon-users" className={className} />
  ),
  Settings: ({ className }: any) => (
    <svg data-testid="icon-settings" className={className} />
  ),
  LogOut: ({ className }: any) => (
    <svg data-testid="icon-logout" className={className} />
  ),
  Menu: ({ className }: any) => (
    <svg data-testid="icon-menu" className={className} />
  ),
  X: ({ className }: any) => (
    <svg data-testid="icon-x" className={className} />
  ),
  Building2: ({ className }: any) => (
    <svg data-testid="icon-building2" className={className} />
  ),
}));

// Mock app-store
vi.mock('@/shared/application/stores/app-store', async () => {
  const { create } = await import('zustand');
  const store = create((set) => ({
    sidebarOpen: false,
    settings: { language: 'en' },
    toggleSidebar: () => {
      console.log('toggleSidebar called');
      set((state: any) => ({ sidebarOpen: !state.sidebarOpen }));
    },
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    closeSidebar: () => set({ sidebarOpen: false }),
    setLanguage: (language: string) => set((state: any) => ({ settings: { ...state.settings, language } })),
  }));
  return { useAppStore: store };
});

// Import after mocks are set up
import { appRoute as Route } from '@/features/app/presentation/routing';
import { useAppStore } from '@/shared/application/stores/app-store';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockGetSession__.mockResolvedValue(mockSession);
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
    expect(route.id).toBe('/app');
  });

  it('should return session when user is authenticated', async () => {
    (globalThis as any).__mockGetSession__.mockResolvedValue(mockSession);

    const result = await route.beforeLoad();

    expect(result).toEqual({ session: mockSession.data });
    expect((globalThis as any).__mockGetSession__).toHaveBeenCalled();
  });

  it('should redirect when user is not authenticated', async () => {
    (globalThis as any).__mockGetSession__.mockResolvedValue({ data: null });

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
      expect(redirect).toHaveBeenCalledWith({ to: '/auth/signin' });
    }
  });
});

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseSession__.mockReturnValue(mockSession);
    (globalThis as any).__mockNavigate__.mockReturnValue(undefined);
    useAppStore.setState({ sidebarOpen: false });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render sidebar', () => {
    const { container } = render(<route.component />);

    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeDefined();
  });

  it('should render user info section', () => {
    render(<route.component />);

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  it('should render user avatar with first letter of name', () => {
    const { container } = render(<route.component />);

    const avatar = container.querySelector(String.raw`.rounded-full.bg-primary\/10`);
    expect(avatar).toBeDefined();
    expect(avatar?.textContent).toBe('T');
  });

  it('should render user avatar with "U" when name is not available', () => {
    (globalThis as any).__mockUseSession__.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          name: null,
        },
      },
      isPending: false,
    });

    const { container } = render(<route.component />);

    const avatar = container.querySelector(String.raw`.rounded-full.bg-primary\/10`);
    expect(avatar).toBeDefined();
    expect(avatar?.textContent).toBe('U');
  });

  it('should render all navigation links', () => {
    render(<route.component />);

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Tenants')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('should render navigation links with correct hrefs', () => {
    const { container } = render(<route.component />);

    const links = container.querySelectorAll('[data-testid="link"]');
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/app/dashboard');
    expect(hrefs).toContain('/app/tenants');
    expect(hrefs).toContain('/app/users');
    expect(hrefs).toContain('/app/settings');
  });

  it('should render navigation icons', () => {
    render(<route.component />);

    expect(screen.getByTestId('icon-layout-dashboard')).toBeDefined();
    expect(screen.getByTestId('icon-building2')).toBeDefined();
    expect(screen.getByTestId('icon-users')).toBeDefined();
    expect(screen.getByTestId('icon-settings')).toBeDefined();
  });

  it('should render sign out button', () => {
    render(<route.component />);

    const signOutButton = screen.getByText('Sign Out');
    expect(signOutButton).toBeDefined();
    expect(screen.getByTestId('icon-logout')).toBeDefined();
  });

  it('should call signOut and navigate when sign out button is clicked', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect((globalThis as any).__mockSignOut__).toHaveBeenCalled();
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('should render main content area with Outlet', () => {
    const { container } = render(<route.component />);

    const main = container.querySelector('main');
    expect(main).toBeDefined();
    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render mobile sidebar toggle button', () => {
    render(<route.component />);

    const toggleButton = screen.getByTestId('icon-menu').closest('button');
    expect(toggleButton).toBeDefined();
  });

  it('should toggle sidebar when mobile toggle button is clicked', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const { container } = render(<route.component />);

    const toggleButton = screen.getByTestId('icon-menu').closest('button');
    expect(toggleButton).toBeDefined();

    // Sidebar should be closed initially
    let sidebar = container.querySelector('aside');
    expect(sidebar?.className).toContain('-translate-x-full');

    // Click to open
    fireEvent.click(toggleButton!);

    expect(await screen.findByTestId('icon-x')).toBeDefined();

    sidebar = container.querySelector('aside');
    expect(sidebar?.className).toContain('translate-x-0');
  });

  it('should close sidebar when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<route.component />);

    // Open sidebar first
    const toggleButton = screen.getByTestId('icon-menu').closest('button');
    await user.click(toggleButton!);

    await waitFor(() => {
      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toContain('translate-x-0');
    });

    // Click overlay to close
    const overlay = container.querySelector('.fixed.inset-0.z-40');
    expect(overlay).toBeDefined();

    if (overlay) {
      await user.click(overlay);

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar?.className).toContain('-translate-x-full');
      });
    }
  });

  it('should close sidebar when navigation link is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<route.component />);

    // Open sidebar first
    const toggleButton = screen.getByTestId('icon-menu').closest('button');
    await user.click(toggleButton!);

    await waitFor(() => {
      const sidebar = container.querySelector('aside');
      expect(sidebar?.className).toContain('translate-x-0');
    });

    // Click a navigation link
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toBeDefined();

    if (dashboardLink) {
      await user.click(dashboardLink);

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar?.className).toContain('-translate-x-full');
      });
    }
  });

  it('should show loading state when session is pending', () => {
    (globalThis as any).__mockUseSession__.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<route.component />);

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should not render sidebar when session is pending', () => {
    (globalThis as any).__mockUseSession__.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { container } = render(<route.component />);

    const sidebar = container.querySelector('aside');
    expect(sidebar).toBeNull();
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.sidebar.dashboard');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.sidebar.tenants');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.sidebar.users');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.sidebar.settings');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('nav.signOut');
  });

  it('should render sidebar with correct classes', () => {
    const { container } = render(<route.component />);

    const sidebar = container.querySelector('aside');
    expect(sidebar?.className).toContain('fixed');
    expect(sidebar?.className).toContain('border-r');
    expect(sidebar?.className).toContain('bg-background/95');
  });

  it('should render main content with correct classes', () => {
    const { container } = render(<route.component />);

    const main = container.querySelector('main');
    expect(main?.className).toContain('flex-1');
    expect(main?.className).toContain('overflow-auto');
  });
});
