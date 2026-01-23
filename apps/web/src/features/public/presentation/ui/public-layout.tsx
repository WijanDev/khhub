import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/infrastructure/ui/button';
import { LanguageSwitcher } from '@/shared/infrastructure/ui/language-switcher';
import { useSession } from '@/shared/infrastructure/lib/auth-client';

export function PublicLayout() {
    const location = useLocation();
    const isAuthRoute = location.pathname.startsWith('/auth');

    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader isAuthRoute={isAuthRoute} />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

function PublicHeader({ isAuthRoute }: Readonly<{ isAuthRoute: boolean }>) {
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
                                    <Link to={'/app/dashboard'}>{t('nav.goToDashboard')}</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link to={'/auth/signin'}>{t('nav.signIn')}</Link>
                                    </Button>
                                    <Button variant="default" size="sm" asChild>
                                        <Link to={'/auth/signup'}>{t('nav.getStarted')}</Link>
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

function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
            <p>{t('common.copyright', { year: new Date().getFullYear() })}</p>
        </footer>
    );
}
