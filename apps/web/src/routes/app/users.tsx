import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, RefreshCw, AlertCircle, Users } from 'lucide-react';

export const Route = createFileRoute('/app/users')({
  component: UsersPage,
});

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
  emailVerified?: boolean;
  banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('app.users.title')}</h1>
          <p className="text-muted-foreground">{t('app.users.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchUsers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('app.users.invite')}
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">{t('app.users.errorLoading')}</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="ml-auto">
              {t('common.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && users.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">{t('app.users.empty')}</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('app.users.inviteFirst')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {!isLoading && !error && users.length > 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>{t('app.users.all')}</CardTitle>
            <CardDescription>
              {t('app.users.allDescription')} ({t('app.users.total', { count: users.length })})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        user.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium">
                      {user.role || 'user'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        user.banned
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}
                    >
                      {user.banned ? 'banned' : 'active'}
                    </span>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
