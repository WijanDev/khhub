import { Button } from "@/shared/infrastructure/ui/button";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Building2, Users, Settings } from "lucide-react";
import { useAppStore } from "@/shared/application/stores/app-store";

export function AppNavigation() {
    const { closeSidebar } = useAppStore();
    const { t } = useTranslation();

    const sidebarLinks = [
        { to: '/app/dashboard', label: t('app.sidebar.dashboard'), icon: LayoutDashboard },
        { to: '/app/tenants', label: t('app.sidebar.tenants'), icon: Building2 },
        { to: '/app/users', label: t('app.sidebar.users'), icon: Users },
        { to: '/app/settings', label: t('app.sidebar.settings'), icon: Settings },
    ] as const;

    return (
        <nav className="flex-1 space-y-1 p-4">
            {sidebarLinks.map((link) => (
                <Button
                    key={link.to}
                    variant="ghost"
                    className="w-full justify-start gap-3"
                    asChild
                >
                    <Link
                        to={link.to}
                        activeProps={{ className: 'bg-accent text-accent-foreground' }}
                        onClick={() => closeSidebar()}
                    >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                    </Link>
                </Button>
            ))}
        </nav>
    )
}