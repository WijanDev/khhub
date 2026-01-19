import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicLayout } from '@/features/public/presentation/ui/public-layout';

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

const mockUseLocation = vi.fn().mockReturnValue({
    pathname: '/',
});

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseSession__ = mockUseSession;
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
    };
});

describe('PublicLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/' });
        (globalThis as any).__mockUseSession__.mockReturnValue({
            data: null,
            isPending: false,
        });
    });

    describe('Header', () => {
        it('should render header with navigation', () => {
            render(<PublicLayout />);
            expect(screen.getByText('KH Hub')).toBeDefined();
        });

        it('should render home and about links when not on auth route', () => {
            (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/' });
            render(<PublicLayout />);

            const links = screen.getAllByTestId('link');
            // In the implementation, Home link has to="/" and About has to="/about"
            const homeLink = links.find(link => (link as HTMLAnchorElement).getAttribute('href') === '/');
            const aboutLink = links.find(link => (link as HTMLAnchorElement).getAttribute('href') === '/about');

            expect(homeLink).toBeDefined();
            expect(aboutLink).toBeDefined();
        });

        it('should not render home and about links when on auth route', () => {
            (globalThis as any).__mockUseLocation__.mockReturnValue({ pathname: '/auth/signin' });
            render(<PublicLayout />);

            const links = screen.getAllByTestId('link');
            // Using generic match or precise content check
            const homeLink = links.find(link => link.textContent === 'nav.home');
            const aboutLink = links.find(link => link.textContent === 'nav.about');

            expect(homeLink).toBeUndefined();
            expect(aboutLink).toBeUndefined();
        });

        it('should render language switcher', () => {
            render(<PublicLayout />);
            const languageSwitcher = screen.getByTestId('language-switcher');
            expect(languageSwitcher).toBeDefined();
            expect(languageSwitcher.dataset.variant).toBe('compact');
        });

        it('should render sign in and sign up buttons when user is not authenticated', () => {
            (globalThis as any).__mockUseSession__.mockReturnValue({
                data: null,
                isPending: false,
            });

            render(<PublicLayout />);

            const links = screen.getAllByTestId('link');
            const signInLink = links.find(link => (link as HTMLAnchorElement).getAttribute('href')?.includes('/auth/signin'));
            const signUpLink = links.find(link => (link as HTMLAnchorElement).getAttribute('href')?.includes('/auth/signup'));

            expect(signInLink).toBeDefined();
            expect(signUpLink).toBeDefined();
        });

        it('should render dashboard link when user is authenticated', () => {
            (globalThis as any).__mockUseSession__.mockReturnValue({
                data: { user: { id: '1', email: 'test@example.com' } },
                isPending: false,
            });

            render(<PublicLayout />);

            const links = screen.getAllByTestId('link');
            const dashboardLink = links.find(link => (link as HTMLAnchorElement).getAttribute('href')?.includes('/app/dashboard'));

            expect(dashboardLink).toBeDefined();
        });
    });

    describe('Footer', () => {
        it('should render footer with copyright text', () => {
            render(<PublicLayout />);
            const currentYear = new Date().getFullYear();
            const copyrightText = screen.getByText(new RegExp(`© ${currentYear}`));
            expect(copyrightText).toBeDefined();
        });
    });

    describe('Main Content', () => {
        it('should render Outlet', () => {
            render(<PublicLayout />);
            expect(screen.getByTestId('outlet')).toBeDefined();
        });
    });
});
