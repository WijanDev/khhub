import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api-client';

interface User {
  id: number;
  name: string;
  email: string;
}

const fetchUsers = createServerFn().handler(async () => {
  try {
    const response = await api.users.$get();
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json() as unknown as { users: User[] };
    return data.users;
  } catch {
    throw new Error('Failed to fetch users');
  }
});

export const Route = createFileRoute('/users')({
  loader: async () => {
    const users = await fetchUsers();
    return { users };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users } = Route.useLoaderData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">Users</h1>
          <Badge variant="secondary">{users.length} total</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          Data fetched from the Hono API using server-side rendering
        </p>
      </div>

      <Separator />

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary via-chart-3 to-chart-2 text-lg font-bold text-primary-foreground">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{user.name}</CardTitle>
                  <CardDescription className="truncate">
                    {user.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  ID: {user.id}
                </Badge>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4">
          <span className="text-xl">💡</span>
          <p className="text-sm text-muted-foreground">
            This data is fetched on the server using{' '}
            <code className="rounded bg-background/50 px-1.5 py-0.5 font-mono text-xs">
              createServerFn
            </code>{' '}
            and rendered with SSR for optimal performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
