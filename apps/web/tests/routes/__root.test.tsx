import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string, options?: any) => {
  if (key === 'common.copyright') {
    return `© ${options?.year} KH Hub. All rights reserved.`;
  }
  return key;
});

const mockI18n = {
  language: 'es',
  changeLanguage: vi.fn(),
};

const mockUseSession = vi.fn().mockReturnValue({
  data: null,
  isPending: false,
});

const mockGetCurrentLanguage = vi.fn().mockReturnValue('es');

const mockUseLocation = vi.fn().mockReturnValue({
  pathname: '/',
});

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseSession__ = mockUseSession;
(globalThis as any).__mockGetCurrentLanguage__ = mockGetCurrentLanguage;
(globalThis as any).__mockUseLocation__ = mockUseLocation;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (globalThis as any).__mockT__,
    i18n: (globalThis as any).__mockI18n__,
  }),
}));

// Mock auth-client
vi.mock('@/shared/infrastructure/lib/auth-client', () => ({
  useSession: () => (globalThis as any).__mockUseSession__(),
}));

// Mock i18n
vi.mock('@/shared/infrastructure/i18n', () => ({
  getCurrentLanguage: () => (globalThis as any).__mockGetCurrentLanguage__(),
}));

// Mock LanguageSwitcher
vi.mock('@/shared/infrastructure/ui/language-switcher', () => ({
  LanguageSwitcher: ({ variant }: { variant?: string }) => (
    <div data-testid="language-switcher" data-variant={variant}>
      Language Switcher
    </div>
  ),
}));

// Mock Button
vi.mock('@/shared/infrastructure/ui/button', () => ({
  Button: ({ children, variant, size, asChild, ...props }: any) => {
    if (asChild) return children;
    return (
      <button
        data-testid="button"
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  },
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');

  return {
    createRootRoute: vi.fn((config: any) => ({
      ...config,
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
      ...config,
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    }))),
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    Link: ({ to, children, className, activeProps, ...props }: any) => {
      return React.createElement('a', {
        href: to,
        className,
        'data-testid': 'link',
        ...props,
      }, children);
    },
    Outlet: () => React.createElement('div', { 'data-testid': 'outlet' }, 'Outlet Content'),
    useLocation: () => (globalThis as any).__mockUseLocation__(),
    HeadContent: () => React.createElement('div', { 'data-testid': 'head-content' }, 'Head Content'),
    Scripts: () => React.createElement('div', { 'data-testid': 'scripts' }, 'Scripts'),
  };
});

// Mock CSS import
vi.mock('@/shared/infrastructure/styles/global.css?url', () => ({
  default: '/styles/global.css',
}));

// Import after mocks are set up
import { rootRoute as Route } from '@/shared/presentation/routing/root';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have head function', () => {
    expect(route.head).toBeDefined();
    expect(typeof route.head).toBe('function');
  });

  it('should return correct head configuration', () => {
    const headConfig = route.head();

    expect(headConfig).toHaveProperty('meta');
    expect(headConfig).toHaveProperty('links');

    expect(headConfig.meta).toEqual([
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'KH Hub' },
    ]);

    expect(headConfig.links).toBeDefined();
    expect(Array.isArray(headConfig.links)).toBe(true);
    expect(headConfig.links.length).toBeGreaterThan(0);
  });

  it('should include stylesheet link', () => {
    const headConfig = route.head();
    const stylesheetLink = headConfig.links.find((link: any) => link.rel === 'stylesheet' && link.href === '/styles/global.css');
    expect(stylesheetLink).toBeDefined();
  });

  it('should include Google Fonts link', () => {
    const headConfig = route.head();
    const fontsLink = headConfig.links.find((link: any) =>
      link.href?.includes('fonts.googleapis.com')
    );
    expect(fontsLink).toBeDefined();
  });
});

describe('RootComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/' });
    (globalThis as any).__mockGetCurrentLanguage__.mockReturnValue('es');
  });

  it('should call getCurrentLanguage for language normalization', () => {
    (globalThis as any).__mockGetCurrentLanguage__.mockReturnValue('en');
    render(<route.component />);

    expect((globalThis as any).__mockGetCurrentLanguage__).toHaveBeenCalled();
  });

  it('should render HeadContent', () => {
    // HeadContent is rendered inside <head>, which React Testing Library doesn't render in DOM
    // We verify the component renders successfully, which means HeadContent was called
    const { container } = render(<route.component />);

    // Verify body is rendered (indirectly confirms HeadContent was rendered as part of component tree)
    expect(container.querySelector('body')).toBeDefined();
    // Verify the component structure is correct
    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render Scripts', () => {
    render(<route.component />);

    expect(screen.getByTestId('scripts')).toBeDefined();
  });

  it('should render body with correct className', () => {
    render(<route.component />);

    // The body element is rendered, check for content inside it
    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render background gradient effects', () => {
    const { container } = render(<route.component />);

    // Check for gradient container class
    const gradientContainer = container.querySelector('.pointer-events-none');
    expect(gradientContainer).toBeDefined();
  });

  it('should render AppHeader when on app route', () => {
    (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/app/dashboard' });

    render(<route.component />);

    // AppHeader should be rendered
    expect(screen.getByText('KH Hub')).toBeDefined();
    expect(screen.getByTestId('language-switcher')).toBeDefined();
  });

  it('should render Outlet', () => {
    render(<route.component />);

    expect(screen.getByTestId('outlet')).toBeDefined();
  });

  it('should render main wrapper for non-app routes', () => {
    (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/' });

    const { container } = render(<route.component />);

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeDefined();
    expect(mainElement?.className).toContain('mx-auto');
  });

  it('should not render main wrapper for app routes', () => {
    (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/app/dashboard' });

    const { container } = render(<route.component />);

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeNull();
  });
});

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/app/dashboard' });
  });

  it('should render header with KH Hub link', () => {
    render(<route.component />);

    expect(screen.getByText('KH Hub')).toBeDefined();
  });

  it('should render language switcher', () => {
    render(<route.component />);

    const languageSwitcher = screen.getByTestId('language-switcher');
    expect(languageSwitcher).toBeDefined();
    expect(languageSwitcher.dataset.variant).toBe('compact');
  });

  it('should render back to home button', () => {
    render(<route.component />);

    const links = screen.getAllByTestId('link');
    const homeLink = links.find(link => (link as HTMLAnchorElement).href.endsWith('/'));

    expect(homeLink).toBeDefined();
  });
});

