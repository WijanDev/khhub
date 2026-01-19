import { useSession } from "@/shared/infrastructure/lib/auth-client";

export function UserInfo() {
    const { data: session } = useSession();
    return (
        <div className="border-b border-border/40 p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium">{session?.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {session?.user?.email}
                    </p>
                </div>
            </div>
        </div>
    )
}