import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Users, Trash2, Trash } from 'lucide-react';
import { useUsersSuspense, prefetchUsers, userKeys, useDeleteUser } from '@/lib/queries/users';
import { getQueryClientFromContext } from '@/lib/router-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api-client';

export const Route = createFileRoute('/app/users')({
  loader: async ({ context }) => {
    // Prefetch users data in the loader
    const queryClient = getQueryClientFromContext(context);
    if (queryClient) {
      await prefetchUsers(queryClient);
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const deleteUserMutation = useDeleteUser();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [purgingCache, setPurgingCache] = useState(false);
  // Get data with suspense (uses prefetched data from loader)
  const { data } = useUsersSuspense();
  const users = data.users;

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This will send them an email notification.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handlePurgeCache = async () => {
    if (!confirm(t('app.users.purgeCacheConfirm'))) {
      return;
    }

    setPurgingCache(true);
    try {
      const response = await api.cache.purge.$post();
      if (!response.ok) {
        throw new Error('Failed to purge cache');
      }
      // Invalidate and refetch users
      await queryClient.invalidateQueries({ queryKey: userKeys.list() });
      alert(t('app.users.purgeCacheSuccess'));
    } catch (error) {
      console.error('Failed to purge cache:', error);
      alert(t('app.users.purgeCacheError'));
    } finally {
      setPurgingCache(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('app.users.title')}</h1>
          <p className="text-muted-foreground">{t('app.users.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: userKeys.list() })}
            title={t('app.users.refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePurgeCache}
            disabled={purgingCache}
            title={t('app.users.purgeCache')}
          >
            {purgingCache ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('app.users.invite')}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
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
      {users.length > 0 && (
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
                    <div className="flex items-center gap-2" title={user.emailVerified ? t('app.users.emailVerified') : t('app.users.emailNotVerified')}>
                      <Checkbox checked={user.emailVerified === true} disabled={true} />
                      <span className="text-xs text-muted-foreground">
                        {user.emailVerified ? t('app.users.verified') : t('app.users.notVerified')}
                      </span>
                    </div>
                    <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium">
                      {user.role || 'user'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${user.banned === true
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-green-500/10 text-green-500'
                        }`}
                    >
                      {user.banned === true ? 'banned' : 'active'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={deletingUserId === user.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      {deletingUserId === user.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
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
