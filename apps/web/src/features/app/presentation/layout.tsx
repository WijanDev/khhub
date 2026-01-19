import { Outlet, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { authClient, useSession } from '@/shared/infrastructure/lib/auth-client';
import { Button } from '@/shared/infrastructure/ui/button';
import {
    Menu,
    X,
} from 'lucide-react';
import { AppSidebar } from './ui/app-sidebar';

export const appLoader = async () => {
    let headers: HeadersInit | undefined;

    // Only fetch headers on the server
    if (import.meta.env.SSR) {
        const { getRequestHeaders } = await import('@tanstack/react-start/server');
        headers = getRequestHeaders();
    }

    // Check if user is authenticated
    const { data: session } = await authClient.getSession({
        fetchOptions: {
            headers,
        },
    });
    console.log("session", session);
    if (!session) {
        throw redirect({ to: '/auth/signin' });
    }
    return { session };
};

import { useAppStore } from '@/shared/application/stores/app-store';

export function AppLayout() {
    const { t } = useTranslation();
    const { isPending } = useSession();
    const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();

    if (isPending) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-73px)]">
            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-20 z-50 lg:hidden"
                onClick={toggleSidebar}
            >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content */}
            <main className="flex-1 overflow-auto p-6 lg:p-8">
                <Outlet />
            </main>
        </div>
    );
}
