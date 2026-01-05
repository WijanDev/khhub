import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockLoaderData = {
  users: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ],
};

const mockApiUsersGet = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ users: mockLoaderData.users }),
});

// Store in globalThis
(globalThis as any).__mockLoaderData__ = mockLoaderData;
(globalThis as any).__mockApiUsersGet__ = mockApiUsersGet;

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  
  return {
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
      useLoaderData: () => (globalThis as any).__mockLoaderData__,
    })),
  };
});

// Mock TanStack Start
vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn(() => ({
    handler: vi.fn((fn: any) => {
      // Return the handler function itself, which will call api.users.$get()
      return fn;
    }),
  })),
}));

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  api: {
    users: {
      $get: () => (globalThis as any).__mockApiUsersGet__(),
    },
  },
}));

// Mock Card components
vi.mock('@/components/ui/card', () => ({
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
vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span data-testid="badge" data-variant={variant} className={className} {...props}>
      {children}
    </span>
  ),
}));

// Mock Separator component
vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr data-testid="separator" className={className} {...props} />
  ),
}));

// Import after mocks are set up
import { Route } from '../users';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockLoaderData__ = mockLoaderData;
    (globalThis as any).__mockApiUsersGet__.mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockLoaderData.users }),
    });
  });

  it('should be defined', () => {
    expect(Route).toBeDefined();
  });

  it('should have component property', () => {
    expect(route.component).toBeDefined();
    expect(typeof route.component).toBe('function');
  });

  it('should have loader function', () => {
    expect(route.loader).toBeDefined();
    expect(typeof route.loader).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/users');
  });

  it('should call fetchUsers in loader and return users', async () => {
    (globalThis as any).__mockApiUsersGet__.mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockLoaderData.users }),
    });
    
    const result = await route.loader();
    
    expect(result).toEqual({ users: mockLoaderData.users });
    expect((globalThis as any).__mockApiUsersGet__).toHaveBeenCalled();
  });

  it('should throw error when API response is not ok', async () => {
    (globalThis as any).__mockApiUsersGet__.mockResolvedValue({
      ok: false,
    });
    
    await expect(route.loader()).rejects.toThrow('Failed to fetch users');
    expect((globalThis as any).__mockApiUsersGet__).toHaveBeenCalled();
  });

  it('should throw error when API call throws', async () => {
    (globalThis as any).__mockApiUsersGet__.mockRejectedValue(new Error('Network error'));
    
    await expect(route.loader()).rejects.toThrow('Failed to fetch users');
    expect((globalThis as any).__mockApiUsersGet__).toHaveBeenCalled();
  });
});

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockLoaderData__ = mockLoaderData;
  });

  it('should render the component', () => {
    render(<route.component />);
    
    expect(screen.getByText('Users')).toBeDefined();
  });

  it('should render header with title', () => {
    render(<route.component />);
    
    const title = screen.getByText('Users');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-4xl');
  });

  it('should render header with description', () => {
    render(<route.component />);
    
    const description = screen.getByText('Data fetched from the Hono API using server-side rendering');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should render users count badge', () => {
    render(<route.component />);
    
    const badge = screen.getByText('3 total');
    expect(badge).toBeDefined();
    expect(badge.closest('[data-testid="badge"]')?.getAttribute('data-variant')).toBe('secondary');
  });

  it('should render separator', () => {
    const { container } = render(<route.component />);
    
    const separator = container.querySelector('[data-testid="separator"]');
    expect(separator).toBeDefined();
  });

  it('should render all users in grid', () => {
    render(<route.component />);
    
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
    expect(screen.getByText('Bob Johnson')).toBeDefined();
  });

  it('should render user emails', () => {
    render(<route.component />);
    
    expect(screen.getByText('john@example.com')).toBeDefined();
    expect(screen.getByText('jane@example.com')).toBeDefined();
    expect(screen.getByText('bob@example.com')).toBeDefined();
  });

  it('should render user avatars with first letter', () => {
    const { container } = render(<route.component />);
    
    const avatars = container.querySelectorAll('.rounded-full.bg-gradient-to-br');
    expect(avatars.length).toBe(3);
    expect(avatars[0].textContent).toBe('J');
    expect(avatars[1].textContent).toBe('J');
    expect(avatars[2].textContent).toBe('B');
  });

  it('should render user ID badges', () => {
    render(<route.component />);
    
    expect(screen.getByText('ID: 1')).toBeDefined();
    expect(screen.getByText('ID: 2')).toBeDefined();
    expect(screen.getByText('ID: 3')).toBeDefined();
  });

  it('should render active status for each user', () => {
    render(<route.component />);
    
    const activeStatuses = screen.getAllByText('Active');
    expect(activeStatuses.length).toBe(3);
  });

  it('should render users in grid layout', () => {
    const { container } = render(<route.component />);
    
    const gridContainer = container.querySelector('.grid.gap-4');
    expect(gridContainer).toBeDefined();
    expect(gridContainer?.className).toContain('sm:grid-cols-2');
    expect(gridContainer?.className).toContain('lg:grid-cols-3');
  });

  it('should render user cards with hover effects', () => {
    const { container } = render(<route.component />);
    
    const userCards = container.querySelectorAll('[data-testid="card"]');
    // Filter out info card and empty state card
    const cardsWithGroup = Array.from(userCards).filter((card) => 
      card.className.includes('group')
    );
    expect(cardsWithGroup.length).toBe(3);
    cardsWithGroup.forEach((card) => {
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('hover:border-primary/30');
    });
  });

  it('should render empty state when no users', () => {
    (globalThis as any).__mockLoaderData__ = { users: [] };
    
    render(<route.component />);
    
    expect(screen.getByText('No users found')).toBeDefined();
    expect(screen.getByText('0 total')).toBeDefined();
  });

  it('should not render empty state when users exist', () => {
    render(<route.component />);
    
    const emptyState = screen.queryByText('No users found');
    expect(emptyState).toBeNull();
  });

  it('should render info card', () => {
    render(<route.component />);
    
    expect(screen.getByText(/This data is fetched on the server using/)).toBeDefined();
    expect(screen.getByText('createServerFn')).toBeDefined();
  });

  it('should render info card with correct styling', () => {
    const { container } = render(<route.component />);
    
    const infoCard = container.querySelector('.border-primary\\/20.bg-primary\\/5');
    expect(infoCard).toBeDefined();
  });

  it('should render code element in info card', () => {
    const { container } = render(<route.component />);
    
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeDefined();
    expect(codeElement?.textContent).toBe('createServerFn');
  });

  it('should render correct number of user cards', () => {
    const { container } = render(<route.component />);
    
    // Count cards with group class (user cards)
    const userCards = container.querySelectorAll('[data-testid="card"].group');
    expect(userCards.length).toBe(3);
  });

  it('should render user card structure correctly', () => {
    const { container } = render(<route.component />);
    
    const firstUserCard = container.querySelector('[data-testid="card"].group');
    expect(firstUserCard).toBeDefined();
    
    const header = firstUserCard?.querySelector('[data-testid="card-header"]');
    expect(header).toBeDefined();
    
    const content = firstUserCard?.querySelector('[data-testid="card-content"]');
    expect(content).toBeDefined();
  });

  it('should render user name in card title', () => {
    render(<route.component />);
    
    const titles = screen.getAllByTestId('card-title');
    const titleTexts = titles.map((title) => title.textContent);
    expect(titleTexts).toContain('John Doe');
    expect(titleTexts).toContain('Jane Smith');
    expect(titleTexts).toContain('Bob Johnson');
  });

  it('should render user email in card description', () => {
    render(<route.component />);
    
    const descriptions = screen.getAllByTestId('card-description');
    const descriptionTexts = descriptions.map((desc) => desc.textContent);
    expect(descriptionTexts).toContain('john@example.com');
    expect(descriptionTexts).toContain('jane@example.com');
    expect(descriptionTexts).toContain('bob@example.com');
  });

  it('should render ID badges with outline variant', () => {
    render(<route.component />);
    
    const idBadges = screen.getAllByText(/^ID: \d+$/);
    expect(idBadges.length).toBe(3);
    idBadges.forEach((badge) => {
      const badgeElement = badge.closest('[data-testid="badge"]');
      expect(badgeElement?.getAttribute('data-variant')).toBe('outline');
    });
  });

  it('should handle user with empty name', () => {
    (globalThis as any).__mockLoaderData__ = {
      users: [{ id: 1, name: '', email: 'test@example.com' }],
    };
    
    render(<route.component />);
    
    const avatar = screen.getByText('test@example.com').closest('[data-testid="card"]')?.querySelector('.rounded-full');
    expect(avatar?.textContent).toBe('');
  });

  it('should handle single user correctly', () => {
    (globalThis as any).__mockLoaderData__ = {
      users: [{ id: 1, name: 'Single User', email: 'single@example.com' }],
    };
    
    render(<route.component />);
    
    expect(screen.getByText('Single User')).toBeDefined();
    expect(screen.getByText('single@example.com')).toBeDefined();
    expect(screen.getByText('1 total')).toBeDefined();
  });

  it('should render avatar with correct first letter for each user', () => {
    const { container } = render(<route.component />);
    const avatars = container.querySelectorAll('.rounded-full.bg-gradient-to-br');
    
    // Check that avatars show first letter of names
    expect(avatars[0].textContent).toBe('J'); // John
    expect(avatars[1].textContent).toBe('J'); // Jane
    expect(avatars[2].textContent).toBe('B'); // Bob
  });

  it('should render info card emoji', () => {
    const { container } = render(<route.component />);
    
    const infoCard = container.querySelector('.border-primary\\/20.bg-primary\\/5');
    const emoji = infoCard?.querySelector('.text-xl');
    expect(emoji?.textContent).toBe('💡');
  });

  it('should render all card elements with correct structure', () => {
    render(<route.component />);
    
    const cards = screen.getAllByTestId('card');
    // Should have 3 user cards + 1 info card = 4 total (empty state card only shows when no users)
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
