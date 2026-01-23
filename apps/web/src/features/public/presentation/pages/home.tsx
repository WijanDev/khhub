import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/infrastructure/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/infrastructure/ui/card';
import { Badge } from '@/shared/infrastructure/ui/badge';
import { Building2, Database, Zap, HardDrive } from 'lucide-react';
import { api } from '@/shared/infrastructure/lib/api-client';
import { Link, createRoute } from '@tanstack/react-router';
import { publicRouting } from '@/features/public/presentation/routing';

export const homeRoute = createRoute({
    getParentRoute: () => publicRouting,
    path: '/',
    loader: async () => {
        try {
            const response = await api.hello.$get();
            if (!response.ok) {
                return { message: 'Failed to connect to API' };
            }
            return response.json() as Promise<{ message: string }>;
        } catch (error) {
            return { message: `Failed to connect to API. Error: ${error}` };
        }
    },
    component: HomePage,
})

function HomePage() {
    const data = homeRoute.useLoaderData();
    const { t } = useTranslation();

    const features = [
        {
            icon: Building2,
            titleKey: 'landing.features.multiTenant.title',
            descriptionKey: 'landing.features.multiTenant.description',
        },
        {
            icon: Database,
            titleKey: 'landing.features.dynamicConnections.title',
            descriptionKey: 'landing.features.dynamicConnections.description',
        },
        {
            icon: Zap,
            titleKey: 'landing.features.cachingLayer.title',
            descriptionKey: 'landing.features.cachingLayer.description',
        },
        {
            icon: HardDrive,
            titleKey: 'landing.features.objectStorage.title',
            descriptionKey: 'landing.features.objectStorage.description',
        },
    ];

    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="flex flex-col items-center justify-center py-16 text-center">
                <Badge variant="secondary" className="mb-6">
                    {t('landing.hero.badge')}
                </Badge>
                <h1 className="mb-4 bg-gradient-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
                    {t('landing.hero.title')}
                </h1>
                <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                    {t('landing.hero.description')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button size="lg" className="font-semibold" asChild>
                        <Link to="/auth/signup">{t('nav.getStarted')}</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            View on GitHub
                        </a>
                    </Button>
                </div>

                {/* API Status */}
                <Card className="mt-12 border-primary/20 bg-card/50 backdrop-blur">
                    <CardContent className="flex items-center gap-3 py-4">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                        </span>
                        <code className="font-mono text-sm text-foreground">
                            API Status: <span className="text-primary">{data.message}</span>
                        </code>
                    </CardContent>
                </Card>
            </section>

            {/* Features Section */}
            <section>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <Card
                                key={feature.titleKey}
                                className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <CardHeader>
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                                    <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* CTA Section */}
            <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-10 text-center">
                <h2 className="mb-3 text-2xl font-bold">{t('landing.cta.title')}</h2>
                <p className="mb-6 text-muted-foreground">
                    {t('landing.cta.description')}
                </p>
                <Button size="lg" asChild>
                    <Link to="/auth/signup">{t('landing.cta.button')}</Link>
                </Button>
            </section>
        </div>
    );
}
