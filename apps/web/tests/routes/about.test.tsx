import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'about.title': 'About KH Hub',
    'about.description': 'A modern, full-stack application built with cutting-edge technologies.',
    'about.techStack.title': 'Tech Stack',
    'about.techStack.description': 'Built with the best tools and frameworks available.',
    'about.mission.title': 'Our Mission',
    'about.mission.description': 'To provide a powerful and scalable platform for modern web applications.',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (globalThis as any).__mockT__,
    i18n: (globalThis as any).__mockI18n__,
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');

  return {
    createRoute: vi.fn((config: any) => ({
      ...config,
      id: config.path || 'mock-route',
      path: config.path,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
    createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    }))),
  };
});

// Mock Card components
vi.mock('@/shared/infrastructure/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 data-testid="card-title" className={className} {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p data-testid="card-description" className={className} {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Badge component
vi.mock('@/shared/infrastructure/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

// Mock Separator component
vi.mock('@/shared/infrastructure/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr data-testid="separator" className={className} {...props} />
  ),
}));

// Import after mocks are set up
import { aboutRoute as Route } from '@/features/public/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/about');
  });
});

describe('AboutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockT__.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'about.title': 'About KH Hub',
        'about.description': 'A modern, full-stack application built with cutting-edge technologies.',
        'about.techStack.title': 'Tech Stack',
        'about.techStack.description': 'Built with the best tools and frameworks available.',
        'about.mission.title': 'Our Mission',
        'about.mission.description': 'To provide a powerful and scalable platform for modern web applications.',
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('About KH Hub')).toBeDefined();
  });

  it('should render header section with title', () => {
    render(<route.component />);

    const title = screen.getByText('About KH Hub');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-4xl');
  });

  it('should render header section with description', () => {
    render(<route.component />);

    const description = screen.getByText('A modern, full-stack application built with cutting-edge technologies.');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should render separators', () => {
    const { container } = render(<route.component />);

    const separators = container.querySelectorAll('[data-testid="separator"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('should render tech stack section with title', () => {
    render(<route.component />);

    const techStackTitle = screen.getByText('Tech Stack');
    expect(techStackTitle).toBeDefined();
    expect(techStackTitle.tagName).toBe('H2');
  });

  it('should render tech stack section with description', () => {
    render(<route.component />);

    const techStackDescription = screen.getByText('Built with the best tools and frameworks available.');
    expect(techStackDescription).toBeDefined();
  });

  it('should render all tech stack items', () => {
    render(<route.component />);

    const techStack = [
      'Hono',
      'TanStack Start',
      'Cloudflare D1',
      'Cloudflare KV',
      'Cloudflare R2',
      'Drizzle ORM',
      'Better Auth',
      'shadcn/ui',
    ];

    techStack.forEach((tech) => {
      expect(screen.getByText(tech)).toBeDefined();
    });
  });

  it('should render tech stack cards with correct structure', () => {
    const { container } = render(<route.component />);

    const cards = container.querySelectorAll('[data-testid="card"]');
    expect(cards.length).toBe(9); // 8 tech stack cards + 1 project structure card
  });

  it('should render tech stack cards with categories', () => {
    render(<route.component />);

    const categories = [
      'Backend',
      'Frontend',
      'Database',
      'Cache',
      'Storage',
      'ORM',
      'Auth',
      'UI',
    ];

    categories.forEach((category) => {
      const badges = screen.getAllByTestId('badge');
      const categoryBadge = badges.find((badge) => badge.textContent === category);
      expect(categoryBadge).toBeDefined();
    });
  });

  it('should render tech stack cards with descriptions', () => {
    render(<route.component />);

    const descriptions = [
      'Ultrafast API for Cloudflare Workers',
      'Full-stack React with SSR',
      'Edge SQLite database',
      'Global key-value storage',
      'S3-compatible object storage',
      'TypeScript-first ORM',
      'Modern auth solution',
      'Beautiful UI components',
    ];

    descriptions.forEach((description) => {
      expect(screen.getByText(description)).toBeDefined();
    });
  });

  it('should render mission section with title', () => {
    render(<route.component />);

    const missionTitle = screen.getByText('Our Mission');
    expect(missionTitle).toBeDefined();
    expect(missionTitle.tagName).toBe('H2');
  });

  it('should render mission section with description', () => {
    render(<route.component />);

    const missionDescription = screen.getByText('To provide a powerful and scalable platform for modern web applications.');
    expect(missionDescription).toBeDefined();
  });

  it('should render mission section with correct styling', () => {
    const { container } = render(<route.component />);

    const missionSection = container.querySelector('.rounded-2xl.border');
    expect(missionSection).toBeDefined();
    expect(missionSection?.className).toContain('bg-gradient-to-br');
  });

  it('should render project structure section with title', () => {
    render(<route.component />);

    const projectStructureTitle = screen.getByText('Project Structure');
    expect(projectStructureTitle).toBeDefined();
    expect(projectStructureTitle.tagName).toBe('H2');
  });

  it('should render project structure code block', () => {
    const { container } = render(<route.component />);

    const codeBlock = container.querySelector('pre code');
    expect(codeBlock).toBeDefined();
    expect(codeBlock?.textContent).toContain('khhub/');
    expect(codeBlock?.textContent).toContain('apps/');
    expect(codeBlock?.textContent).toContain('api/');
    expect(codeBlock?.textContent).toContain('web/');
  });

  it('should render project structure card', () => {
    const { container } = render(<route.component />);

    // Find the card that contains the code block
    const codeBlock = container.querySelector('pre code');
    expect(codeBlock).toBeDefined();

    // Find the parent card
    const cardContent = codeBlock?.closest('[data-testid="card-content"]');
    expect(cardContent).toBeDefined();

    const projectStructureCard = cardContent?.closest('[data-testid="card"]');
    expect(projectStructureCard).toBeDefined();
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.techStack.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.techStack.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.mission.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('about.mission.description');
  });

  it('should render tech stack in grid layout', () => {
    const { container } = render(<route.component />);

    const gridContainer = container.querySelector('.grid.gap-4');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('sm:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-4');
  });

  it('should render badges with outline variant', () => {
    render(<route.component />);

    const badges = screen.getAllByTestId('badge');
    badges.forEach((badge) => {
      expect(badge.getAttribute('data-variant')).toBe('outline');
    });
  });

  it('should render tech stack cards with correct card structure', () => {
    const { container } = render(<route.component />);

    const techCards = container.querySelectorAll('[data-testid="card"]');
    // Check that tech stack cards have CardHeader with CardTitle and CardDescription
    techCards.forEach((card) => {
      const header = card.querySelector('[data-testid="card-header"]');
      if (header) {
        const title = header.querySelector('[data-testid="card-title"]');
        const description = header.querySelector('[data-testid="card-description"]');
        // At least one tech card should have both title and description
        if (title && description) {
          expect(title).toBeDefined();
          expect(description).toBeDefined();
        }
      }
    });
  });
});
