import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();

  const techStack = [
    { name: 'Hono', description: 'Ultrafast API for Cloudflare Workers', category: 'Backend' },
    { name: 'TanStack Start', description: 'Full-stack React with SSR', category: 'Frontend' },
    { name: 'Cloudflare D1', description: 'Edge SQLite database', category: 'Database' },
    { name: 'Cloudflare KV', description: 'Global key-value storage', category: 'Cache' },
    { name: 'Cloudflare R2', description: 'S3-compatible object storage', category: 'Storage' },
    { name: 'Drizzle ORM', description: 'TypeScript-first ORM', category: 'ORM' },
    { name: 'Better Auth', description: 'Modern auth solution', category: 'Auth' },
    { name: 'shadcn/ui', description: 'Beautiful UI components', category: 'UI' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">{t('about.title')}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {t('about.description')}
        </p>
      </div>

      <Separator />

      {/* Tech Stack */}
      <section>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">{t('about.techStack.title')}</h2>
        <p className="mb-6 text-muted-foreground">{t('about.techStack.description')}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Mission */}
      <section className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-8">
        <h2 className="mb-3 text-2xl font-semibold tracking-tight">{t('about.mission.title')}</h2>
        <p className="text-lg text-muted-foreground">
          {t('about.mission.description')}
        </p>
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
│   ├── api/                 # Hono API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── db/          # Drizzle schema & migrations
│   │   │   ├── lib/         # Auth, cache, storage
│   │   │   ├── routes/      # API routes
│   │   │   └── index.ts     # Entry point
│   │   └── wrangler.json    # Workers config
│   └── web/                 # TanStack Start (Cloudflare Pages)
│       └── src/
│           ├── components/  # UI components
│           ├── i18n/        # Internationalization
│           ├── routes/      # File-based routing
│           └── styles/      # Global styles
├── packages/                # Shared packages
└── package.json             # Root workspace`}</code>
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
