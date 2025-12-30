import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fetchHello = createServerFn().handler(async () => {
  const res = await fetch('http://localhost:8787/api/hello');
  if (!res.ok) {
    return { message: 'Failed to connect to API' };
  }
  return res.json() as Promise<{ message: string }>;
});

export const Route = createFileRoute('/')({
  loader: async () => {
    const data = await fetchHello();
    return data;
  },
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();

  const features = [
    {
      icon: '⚡',
      title: 'Hono API',
      description: 'Ultrafast, lightweight backend with Hono running on Node.js',
      badge: 'Backend',
    },
    {
      icon: '🚀',
      title: 'TanStack Start',
      description: 'Full-stack React framework with SSR, streaming, and server functions',
      badge: 'Frontend',
    },
    {
      icon: '📦',
      title: 'Monorepo',
      description: 'Organized workspace structure with npm workspaces',
      badge: 'Architecture',
    },
    {
      icon: '🎨',
      title: 'shadcn/ui',
      description: 'Beautiful, accessible components built with Radix UI and Tailwind',
      badge: 'UI',
    },
    {
      icon: '🔷',
      title: 'TypeScript',
      description: 'End-to-end type safety across the entire codebase',
      badge: 'Language',
    },
    {
      icon: '⚙️',
      title: 'Vite',
      description: 'Lightning fast HMR and optimized production builds',
      badge: 'Tooling',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 text-center">
        <Badge variant="secondary" className="mb-6">
          Open Source Monorepo Template
        </Badge>
        <h1 className="mb-4 bg-gradient-to-r from-primary via-chart-3 to-chart-2 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          Welcome to KH Hub
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          A modern full-stack monorepo with Hono API and TanStack Start SSR.
          Production-ready, type-safe, and beautifully designed.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="font-semibold">
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            View on GitHub
          </Button>
        </div>

        {/* API Status */}
        <Card className="mt-12 border-primary/20 bg-card/50 backdrop-blur">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
            </span>
            <code className="font-mono text-sm text-foreground">
              API Status: <span className="text-primary">{data.message}</span>
            </code>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">
            Everything you need
          </h2>
          <p className="text-muted-foreground">
            A complete stack for building modern web applications
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-3xl">{feature.icon}</span>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-10 text-center">
        <h2 className="mb-3 text-2xl font-bold">Ready to build?</h2>
        <p className="mb-6 text-muted-foreground">
          Clone the repository and start building your next project in minutes.
        </p>
        <Card className="mx-auto max-w-lg border-primary/20 bg-background/50">
          <CardContent className="py-4">
            <code className="font-mono text-sm">
              npx degit your-repo/khhub my-app
            </code>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
