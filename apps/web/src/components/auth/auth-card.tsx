import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthCardProps {
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function AuthCard({ title, description, children, footer, className }: Readonly<AuthCardProps>) {
    return (
        <Card className={`w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm ${className || ''}`}>
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
            {footer && (
                <CardFooter className="flex flex-col space-y-4">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
