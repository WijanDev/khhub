import { createRootRouteWithContext, Link, Outlet, useLocation, HeadContent, Scripts } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/infrastructure/ui/button';
import { LanguageSwitcher } from '@/shared/infrastructure/ui/language-switcher';
import { getCurrentLanguage } from '@/shared/infrastructure/i18n';
import stylesUrl from '@/shared/infrastructure/styles/global.css?url';

export interface MyRouterContext {
    queryClient: QueryClient;
}

export const rootRoute = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            { charSet: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { title: 'KH Hub' },
        ],
        links: [
            { rel: 'icon', type: 'image/svg+xml', href: '/vite.svg' },
            { rel: 'stylesheet', href: stylesUrl },
            {
                rel: 'stylesheet',
                href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
            },
        ],
    }),
    component: RootComponent,
});

function RootComponent() {
    const location = useLocation();
    const isAppRoute = location.pathname.startsWith('/app');

    // Normalize language code to prevent hydration mismatch (e.g., 'es-ES' -> 'es')
    const normalizedLang = getCurrentLanguage();

    return (
        <html lang={normalizedLang}>
            <head>
                <HeadContent />
            </head>
            <body
                className="min-h-screen bg-background font-sans antialiased"
                suppressHydrationWarning
            >
                {/* Background gradient effect */}
                <div className="pointer-events-none fixed inset-0 -z-10">
                    <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-chart-2/10 blur-[100px]" />
                </div>

                <div className="flex min-h-screen flex-col">
                    {/* App Header - Show when in /app */}
                    {isAppRoute && <AppHeader />}

                    {/* Main Content */}
                    {isAppRoute ? (
                        <Outlet />
                    ) : (
                        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
                            <Outlet />
                        </main>
                    )}
                </div>
                <Scripts />
            </body>
        </html>
    );
}

function AppHeader() {
    const { t } = useTranslation();

    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <nav className="flex items-center justify-between px-6 py-4">
                <Link
                    to="/"
                    className="bg-gradient-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-xl font-bold tracking-tight text-transparent"
                >
                    KH Hub
                </Link>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher variant="compact" />
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/">{t('common.backToHome')}</Link>
                    </Button>
                </div>
            </nav>
        </header>
    );
}
