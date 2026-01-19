interface AuthErrorProps {
    error: string | null | undefined;
}

export function AuthError({ error }: Readonly<AuthErrorProps>) {
    if (!error) return null;

    return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
        </div>
    );
}
