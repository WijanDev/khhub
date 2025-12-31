import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { HeadContent, Scripts } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useSession } from '@/lib/auth-client';
import { getCurrentLanguage } from '@/i18n';
import stylesUrl from '@/styles/global.css?url';

export const Route = createRootRoute({
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
  const { i18n } = useTranslation();
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const isAuthRoute = location.pathname.startsWith('/auth');
  
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
          {/* Header - Only show public header when not in /app */}
          {!isAppRoute && <PublicHeader isAuthRoute={isAuthRoute} />}

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

          {/* Footer - Only show on public pages */}
          {!isAppRoute && <Footer />}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function PublicHeader({ isAuthRoute }: { isAuthRoute: boolean }) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="bg-gradient-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-xl font-bold tracking-tight text-transparent"
        >
          KH Hub
        </Link>
        <div className="flex items-center gap-1">
          {!isAuthRoute && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/"
                  activeProps={{ className: 'bg-accent text-accent-foreground' }}
                >
                  {t('nav.home')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to="/about"
                  activeProps={{ className: 'bg-accent text-accent-foreground' }}
                >
                  {t('nav.about')}
                </Link>
              </Button>
            </>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher variant="compact" />

          {/* Auth buttons */}
          {!isPending && (
            <>
              {session ? (
                <Button variant="default" size="sm" asChild>
                  <Link to="/app/dashboard">{t('nav.goToDashboard')}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth/signin">{t('nav.signIn')}</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/auth/signup">{t('nav.getStarted')}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
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

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
      <p>{t('common.copyright', { year: new Date().getFullYear() })}</p>
    </footer>
  );
}
