import { Button } from "@/shared/infrastructure/ui/button";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { signOut } from "@/shared/infrastructure/lib/auth-client";

export function SignOut() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate({ to: '/' });
    };

    return (
        <div className="border-t border-border/40 p-4">
            <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
            >
                <LogOut className="h-4 w-4" />
                {t('nav.signOut')}
            </Button>
        </div>
    )
}