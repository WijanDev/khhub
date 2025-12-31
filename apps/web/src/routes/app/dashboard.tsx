import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Building2, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const Route = createFileRoute('/app/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const stats = [
    {
      titleKey: 'app.dashboard.stats.totalUsers',
      value: '2,543',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
    },
    {
      titleKey: 'app.dashboard.stats.activeTenants',
      value: '48',
      change: '+4.3%',
      trend: 'up' as const,
      icon: Building2,
    },
    {
      titleKey: 'app.dashboard.stats.totalSessions',
      value: '12,847',
      change: '+23.1%',
      trend: 'up' as const,
      icon: Activity,
    },
    {
      titleKey: 'app.dashboard.stats.growthRate',
      value: '18.2%',
      change: '-2.4%',
      trend: 'down' as const,
      icon: TrendingUp,
    },
  ];

  const recentActivity = [
    { action: 'New user registered', user: 'alice@example.com', time: '2 minutes ago' },
    { action: 'Tenant created', user: 'admin@example.com', time: '15 minutes ago' },
    { action: 'Settings updated', user: 'bob@example.com', time: '1 hour ago' },
    { action: 'New user registered', user: 'charlie@example.com', time: '2 hours ago' },
    { action: 'Database connection added', user: 'admin@example.com', time: '3 hours ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('app.dashboard.title')}</h1>
        <p className="text-muted-foreground">
          {t('app.dashboard.welcome', { name: session?.user?.name })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.titleKey} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(stat.titleKey)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}
                >
                  {stat.change}
                </span>
                <span className="ml-1 text-muted-foreground">{t('app.dashboard.fromLastMonth')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>{t('app.dashboard.recentActivity.title')}</CardTitle>
            <CardDescription>{t('app.dashboard.recentActivity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground">{item.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>{t('app.dashboard.quickActions.title')}</CardTitle>
            <CardDescription>{t('app.dashboard.quickActions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              {t('app.dashboard.quickActions.inviteTeam')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              {t('app.dashboard.quickActions.createTenant')}
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              {t('app.dashboard.quickActions.viewAnalytics')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
