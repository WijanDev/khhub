import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  const techStack = [
    { name: 'React 19', description: 'UI library with concurrent features', category: 'Frontend' },
    { name: 'TanStack Start', description: 'Full-stack React framework with SSR', category: 'Frontend' },
    { name: 'TanStack Router', description: 'Type-safe routing with file-based routes', category: 'Frontend' },
    { name: 'Hono', description: 'Ultrafast web framework for the edge', category: 'Backend' },
    { name: 'Vite', description: 'Next-generation frontend tooling', category: 'Tooling' },
    { name: 'TypeScript', description: 'JavaScript with syntax for types', category: 'Language' },
    { name: 'Tailwind CSS', description: 'Utility-first CSS framework', category: 'Styling' },
    { name: 'shadcn/ui', description: 'Re-usable components built with Radix', category: 'UI' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">About KH Hub</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A production-ready monorepo template for building modern full-stack applications
          with the latest technologies.
        </p>
      </div>

      <Separator />

      {/* Tech Stack */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Technology Stack</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {techStack.map((tech) => (
            <Card key={tech.name} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tech.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {tech.category}
                  </Badge>
                </div>
                <CardDescription>{tech.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Project Structure */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Project Structure</h2>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <pre className="overflow-x-auto rounded-lg bg-background/80 p-4 font-mono text-sm leading-relaxed text-muted-foreground">
              <code>{`khhub/
├── apps/
│   ├── api/                 # Hono API server
│   │   └── src/
│   │       └── index.ts     # API entry point
│   └── web/                 # TanStack Start webapp
│       └── src/
│           ├── components/  # UI components
│           ├── routes/      # File-based routing
│           ├── styles/      # Global styles
│           ├── router.tsx   # Router config
│           ├── client.tsx   # Client entry
│           └── ssr.tsx      # Server entry
├── packages/                # Shared packages
├── package.json             # Root workspace config
└── tsconfig.base.json       # Shared TS config`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Features */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Server-Side Rendering', description: 'Full SSR with streaming support' },
            { title: 'Type Safety', description: 'End-to-end TypeScript coverage' },
            { title: 'Server Functions', description: 'RPC-style server function calls' },
            { title: 'File-Based Routing', description: 'Automatic route generation' },
            { title: 'Workspace Management', description: 'npm workspaces for monorepo' },
            { title: 'Modern UI', description: 'shadcn/ui with Tailwind CSS v4' },
          ].map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
