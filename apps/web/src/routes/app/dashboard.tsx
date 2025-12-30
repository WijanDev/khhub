import { createFileRoute } from '@tanstack/react-router';
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

const stats = [
  {
    title: 'Total Users',
    value: '2,543',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Active Tenants',
    value: '48',
    change: '+4.3%',
    trend: 'up',
    icon: Building2,
  },
  {
    title: 'Total Sessions',
    value: '12,847',
    change: '+23.1%',
    trend: 'up',
    icon: Activity,
  },
  {
    title: 'Growth Rate',
    value: '18.2%',
    change: '-2.4%',
    trend: 'down',
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

function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name}! Here's what's happening.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
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
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your workspace</CardDescription>
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Invite team member
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Create new tenant
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              View analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

