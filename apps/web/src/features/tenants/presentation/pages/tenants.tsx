import { createRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/infrastructure/ui/card';
import { Button } from '@/shared/infrastructure/ui/button';
import { Building2, Plus, RefreshCw } from 'lucide-react';
import { useTenantsSuspense, tenantKeys } from '@/shared/infrastructure/lib/queries/tenants';
import { tenantsRoute } from '../routing';

export const tenantsIndexRoute = createRoute({
    getParentRoute: () => tenantsRoute,
    path: '/',
    component: TenantsListPage,
});

export function TenantsListPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    // Get data with suspense (uses prefetched data from loader)
    const { data } = useTenantsSuspense();
    const tenants = data.tenants;

    const tenantColorMap = new Map<string | null, string>([
        ['active', 'bg-green-500/10 text-green-500'],
        ['suspended', 'bg-red-500/10 text-red-500'],
        ['inactive', 'bg-yellow-500/10 text-yellow-500'],
        ['pending', 'bg-yellow-500/10 text-yellow-500'],
        [null, 'bg-gray-500/10 text-gray-500'],
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('app.tenants.title')}</h1>
                    <p className="text-muted-foreground">{t('app.tenants.description')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => queryClient.invalidateQueries({ queryKey: tenantKeys.list() })}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('app.tenants.create')}
                    </Button>
                </div>
            </div>

            {/* Empty State */}
            {tenants.length === 0 && (
                <Card className="border-border/50 bg-card/50">
                    <CardContent className="p-8 text-center">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">{t('app.tenants.empty')}</p>
                        <Button className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('app.tenants.createFirst')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Tenants Grid */}
            {tenants.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tenants.map((tenant) => (
                        <Card key={tenant.id} className="border-border/50 bg-card/50 hover:border-primary/50 transition-colors">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                    <CardDescription>/{tenant.slug}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t('app.tenants.createdAt', {
                                            date: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'
                                        })}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${tenantColorMap.get(tenant.status) || 'bg-green-500/10 text-green-500'
                                            }`}
                                    >
                                        {tenant.status || 'active'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
