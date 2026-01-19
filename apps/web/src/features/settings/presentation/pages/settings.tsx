import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/infrastructure/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/infrastructure/ui/card';
import { Button } from '@/shared/infrastructure/ui/button';
import { Input } from '@/shared/infrastructure/ui/input';
import { Label } from '@/shared/infrastructure/ui/label';
import { Separator } from '@/shared/infrastructure/ui/separator';
import { LanguageSwitcher } from '@/shared/infrastructure/ui/language-switcher';
import { settingsRoute } from '../routing';
import { createRoute } from '@tanstack/react-router';

export const settingsIndexRoute = createRoute({
    getParentRoute: () => settingsRoute,
    path: '/',
    component: SettingsPage,
});

function SettingsPage() {
    const { t } = useTranslation();
    const { data: session } = useSession();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('app.settings.title')}</h1>
                <p className="text-muted-foreground">{t('app.settings.description')}</p>
            </div>

            {/* Profile Settings */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader>
                    <CardTitle>{t('app.settings.profile.title')}</CardTitle>
                    <CardDescription>{t('app.settings.profile.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('app.settings.profile.name')}</Label>
                        <Input id="name" defaultValue={session?.user?.name || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('app.settings.profile.email')}</Label>
                        <Input id="email" type="email" defaultValue={session?.user?.email || ''} disabled />
                        <p className="text-xs text-muted-foreground">
                            {t('app.settings.profile.emailHint')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Language</Label>
                        <LanguageSwitcher />
                    </div>
                    <Button>{t('app.settings.profile.save')}</Button>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-border/50 bg-card/50">
                <CardHeader>
                    <CardTitle>{t('app.settings.security.title')}</CardTitle>
                    <CardDescription>{t('app.settings.security.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">{t('app.settings.security.currentPassword')}</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('app.settings.security.newPassword')}</Label>
                        <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">{t('app.settings.security.confirmPassword')}</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                    <Button>{t('app.settings.security.update')}</Button>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-card/50">
                <CardHeader>
                    <CardTitle className="text-destructive">{t('app.settings.danger.title')}</CardTitle>
                    <CardDescription>{t('app.settings.danger.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">{t('app.settings.danger.deleteAccount')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('app.settings.danger.deleteAccountDescription')}
                            </p>
                        </div>
                        <Button variant="destructive">{t('app.settings.danger.deleteAccount')}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
