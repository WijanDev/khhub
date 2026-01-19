import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    emailVerified: true,
    role: 'admin',
    banned: false,
    image: null,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    emailVerified: false,
    role: 'user',
    banned: false,
    image: 'https://example.com/avatar.jpg',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    emailVerified: true,
    role: 'user',
    banned: true,
    image: null,
  },
];

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'app.users.title': 'Users',
    'app.users.description': 'Manage users',
    'app.users.refresh': 'Refresh',
    'app.users.purgeCache': 'Purge Cache',
    'app.users.purgeCacheConfirm': 'Are you sure you want to purge the cache?',
    'app.users.purgeCacheSuccess': 'Cache purged successfully',
    'app.users.purgeCacheError': 'Failed to purge cache',
    'app.users.invite': 'Invite User',
    'app.users.empty': 'No users found',
    'app.users.inviteFirst': 'Invite First User',
    'app.users.all': 'All Users',
    'app.users.allDescription': 'Manage all users',
    'app.users.total': `Total: ${options?.count || 0}`,
    'app.users.emailVerified': 'Email verified',
    'app.users.emailNotVerified': 'Email not verified',
    'app.users.verified': 'Verified',
    'app.users.notVerified': 'Not Verified',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockQueryClient = {
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  prefetchQuery: vi.fn().mockResolvedValue(undefined),
};

const mockUseUsersSuspense = vi.fn().mockReturnValue({
  data: { users: mockUsers },
});

const mockDeleteUserMutation = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
  error: null,
};

const mockUseDeleteUser = vi.fn().mockReturnValue(mockDeleteUserMutation);

const mockPrefetchUsers = vi.fn().mockResolvedValue(undefined);

const mockUsersApiCachePurge = vi.fn().mockResolvedValue({
  ok: true,
});

const mockGetQueryClientFromContext = vi.fn().mockReturnValue(mockQueryClient);

const mockConfirm = vi.fn().mockReturnValue(true);
const mockAlert = vi.fn();

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockQueryClient__ = mockQueryClient;
(globalThis as any).__mockUseUsersSuspense__ = mockUseUsersSuspense;
(globalThis as any).__mockDeleteUserMutation__ = mockDeleteUserMutation;
(globalThis as any).__mockUseDeleteUser__ = mockUseDeleteUser;
(globalThis as any).__mockPrefetchUsers__ = mockPrefetchUsers;
(globalThis as any).__mockUsersApiCachePurge__ = mockUsersApiCachePurge;
(globalThis as any).__mockGetQueryClientFromContext__ = mockGetQueryClientFromContext;
(globalThis as any).__mockConfirm__ = mockConfirm;
(globalThis as any).__mockAlert__ = mockAlert;

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

  return {
    createFileRoute: vi.fn((path: string) => (config: any) => {
      const routeConfig = {
        ...config,
        id: path,
        path,
        useLoaderData: () => ({}),
        update: function (c: any) { Object.assign(this, c); return this; },
        _addFileChildren: function (c: any) { return this; },
        _addFileTypes: function () { return this; },
      };
      return routeConfig;
    }),
    createRoute: vi.fn((config: any) => ({
      ...config,
      id: config.path || 'mock-route',
      update: function (c: any) { Object.assign(this, c); return this; },
    })),
    createRootRouteWithContext: vi.fn(() => vi.fn((config: any) => ({
      id: '__root__',
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    }))),
  };
});

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => (globalThis as any).__mockQueryClient__,
}));

// Mock queries/users
vi.mock('@/shared/infrastructure/lib/queries/users', () => ({
  useUsersSuspense: () => (globalThis as any).__mockUseUsersSuspense__(),
  prefetchUsers: (queryClient: any) => (globalThis as any).__mockPrefetchUsers__(queryClient),
  userKeys: {
    list: () => ['users', 'list'],
  },
  useDeleteUser: () => (globalThis as any).__mockUseDeleteUser__(),
}));

// Mock router-utils
vi.mock('@/shared/infrastructure/lib/router-utils', () => ({
  getQueryClientFromContext: (context: any) => (globalThis as any).__mockGetQueryClientFromContext__(context),
}));

// Mock api-client
vi.mock('@/shared/infrastructure/lib/api-client', () => ({
  api: {
    cache: {
      purge: {
        $post: () => (globalThis as any).__mockUsersApiCachePurge__(),
      },
    },
  },
  getApiBaseUrl: vi.fn(),
}));

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

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, size, onClick, disabled, title, className, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        'data-size': size,
        className,
        disabled,
        onClick,
        title,
        ...props,
      }, children);
    },
  };
});

// Mock Checkbox component
vi.mock('@/shared/infrastructure/ui/checkbox', () => ({
  Checkbox: ({ checked, disabled, ...props }: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      disabled={disabled}
      {...props}
    />
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: ({ className }: any) => <svg data-testid="icon-plus" className={className} />,
  MoreHorizontal: ({ className }: any) => <svg data-testid="icon-more-horizontal" className={className} />,
  RefreshCw: ({ className }: any) => <svg data-testid="icon-refresh-cw" className={className} />,
  AlertCircle: ({ className }: any) => <svg data-testid="icon-alert-circle" className={className} />,
  Users: ({ className }: any) => <svg data-testid="icon-users" className={className} />,
  Trash2: ({ className }: any) => <svg data-testid="icon-trash2" className={className} />,
  Trash: ({ className }: any) => <svg data-testid="icon-trash" className={className} />,
}));

// Mock global confirm and alert
globalThis.confirm = mockConfirm;
globalThis.alert = mockAlert;

// Import after mocks are set up
import { usersIndexRoute as Route } from '@/features/users/presentation/routing';

// Type assertion helper for Route properties
const route = Route as any;

describe('Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockGetQueryClientFromContext__.mockReturnValue(mockQueryClient);
    (globalThis as any).__mockPrefetchUsers__.mockResolvedValue(undefined);
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
    expect(route.id).toBe('/');
  });

  it('should prefetch users in loader when queryClient exists', async () => {
    const context = { queryClient: mockQueryClient };
    await route.loader({ context });

    expect((globalThis as any).__mockGetQueryClientFromContext__).toHaveBeenCalledWith(context);
    expect((globalThis as any).__mockPrefetchUsers__).toHaveBeenCalledWith(mockQueryClient);
  });

  it('should handle loader when queryClient is null', async () => {
    (globalThis as any).__mockGetQueryClientFromContext__.mockReturnValue(null);

    const context = {};
    await route.loader({ context });

    expect((globalThis as any).__mockGetQueryClientFromContext__).toHaveBeenCalledWith(context);
    expect((globalThis as any).__mockPrefetchUsers__).not.toHaveBeenCalled();
  });
});

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseUsersSuspense__.mockReturnValue({
      data: { users: mockUsers },
    });
    (globalThis as any).__mockDeleteUserMutation__.mutateAsync.mockResolvedValue(undefined);
    (globalThis as any).__mockConfirm__.mockReturnValue(true);
    (globalThis as any).__mockUsersApiCachePurge__.mockResolvedValue({ ok: true });

    (globalThis as any).__mockT__.mockImplementation((key: string, options?: any) => {
      const translations: Record<string, string> = {
        'app.users.title': 'Users',
        'app.users.description': 'Manage users',
        'app.users.refresh': 'Refresh',
        'app.users.purgeCache': 'Purge Cache',
        'app.users.purgeCacheConfirm': 'Are you sure you want to purge the cache?',
        'app.users.purgeCacheSuccess': 'Cache purged successfully',
        'app.users.purgeCacheError': 'Failed to purge cache',
        'app.users.invite': 'Invite User',
        'app.users.empty': 'No users found',
        'app.users.inviteFirst': 'Invite First User',
        'app.users.all': 'All Users',
        'app.users.allDescription': 'Manage all users',
        'app.users.total': `Total: ${options?.count || 0}`,
        'app.users.emailVerified': 'Email verified',
        'app.users.emailNotVerified': 'Email not verified',
        'app.users.verified': 'Verified',
        'app.users.notVerified': 'Not Verified',
      };
      return translations[key] || key;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('Users')).toBeDefined();
  });

  it('should render header with title and description', () => {
    render(<route.component />);

    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Manage users')).toBeDefined();
  });

  it('should render refresh button', () => {
    render(<route.component />);

    const refreshButtons = screen.getAllByTestId('button');
    const refreshButton = refreshButtons.find((btn) => btn.getAttribute('title') === 'Refresh');
    expect(refreshButton).toBeDefined();
    expect(refreshButton?.querySelector('[data-testid="icon-refresh-cw"]')).toBeDefined();
  });

  it('should render purge cache button', () => {
    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');
    expect(purgeButton).toBeDefined();
    expect(purgeButton?.querySelector('[data-testid="icon-trash"]')).toBeDefined();
  });

  it('should render invite button', () => {
    render(<route.component />);

    expect(screen.getByText('Invite User')).toBeDefined();
    expect(screen.getByText('Invite User').querySelector('[data-testid="icon-plus"]')).toBeDefined();
  });

  it('should call invalidateQueries when refresh button is clicked', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const refreshButtons = screen.getAllByTestId('button');
    const refreshButton = refreshButtons.find((btn) => btn.getAttribute('title') === 'Refresh');

    await user.click(refreshButton!);

    expect((globalThis as any).__mockQueryClient__.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['users', 'list'],
    });
  });

  it('should render users table when users exist', () => {
    render(<route.component />);

    expect(screen.getByText('All Users')).toBeDefined();
    expect(screen.getByText(/Manage all users/)).toBeDefined();
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

  it('should render user avatars with first letter when image is null', () => {
    const { container } = render(<route.component />);

    const avatars = container.querySelectorAll(String.raw`.rounded-full.bg-primary\/10`);
    expect(avatars.length).toBeGreaterThanOrEqual(2); // At least 2 users without images

    // Check that avatars show first letter
    const johnAvatar = Array.from(avatars).find((avatar) => avatar.textContent === 'J');
    expect(johnAvatar).toBeDefined();
  });

  it('should render user avatars with image when image is provided', () => {
    const { container } = render(<route.component />);

    const images = container.querySelectorAll('img.rounded-full');
    expect(images.length).toBeGreaterThanOrEqual(1); // At least Jane has an image

    const janeImage = Array.from(images).find((img) => (img as HTMLImageElement).alt === 'Jane Smith');
    expect(janeImage).toBeDefined();
    expect((janeImage as HTMLImageElement).src).toBe('https://example.com/avatar.jpg');
  });

  it('should render email verification checkbox for verified users', () => {
    render(<route.component />);

    const checkboxes = screen.getAllByTestId('checkbox');
    const verifiedCheckboxes = checkboxes.filter((cb) => (cb as HTMLInputElement).checked);
    expect(verifiedCheckboxes.length).toBeGreaterThanOrEqual(2); // John and Bob are verified
  });

  it('should render email verification checkbox as unchecked for unverified users', () => {
    render(<route.component />);

    const checkboxes = screen.getAllByTestId('checkbox');
    const unverifiedCheckboxes = checkboxes.filter((cb) => !(cb as HTMLInputElement).checked);
    expect(unverifiedCheckboxes.length).toBeGreaterThanOrEqual(1); // Jane is not verified
  });

  it('should render verification status text', () => {
    render(<route.component />);

    const verifiedTexts = screen.getAllByText('Verified');
    expect(verifiedTexts.length).toBeGreaterThanOrEqual(2); // At least 2 verified users

    const notVerifiedTexts = screen.getAllByText('Not Verified');
    expect(notVerifiedTexts.length).toBeGreaterThanOrEqual(1); // At least 1 unverified user
  });

  it('should render user roles', () => {
    render(<route.component />);

    expect(screen.getByText('admin')).toBeDefined();
    const userRoles = screen.getAllByText('user');
    expect(userRoles.length).toBeGreaterThanOrEqual(2); // At least 2 users with 'user' role
  });

  it('should render user status badges', () => {
    render(<route.component />);

    const activeStatuses = screen.getAllByText('active');
    expect(activeStatuses.length).toBeGreaterThanOrEqual(2); // At least 2 active users

    expect(screen.getByText('banned')).toBeDefined();
  });

  it('should render delete button for each user', () => {
    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    expect(deleteButtons.length).toBe(3);
  });

  it('should call confirm and deleteUserMutation when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    const firstDeleteButton = deleteButtons[0].closest('button');

    await user.click(firstDeleteButton!);

    expect((globalThis as any).__mockConfirm__).toHaveBeenCalledWith(
      expect.stringContaining('John Doe')
    );
    expect((globalThis as any).__mockDeleteUserMutation__.mutateAsync).toHaveBeenCalledWith('1');
  });

  it('should not delete user when confirm returns false', async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockConfirm__.mockReturnValue(false);

    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    const firstDeleteButton = deleteButtons[0].closest('button');

    await user.click(firstDeleteButton!);

    expect((globalThis as any).__mockConfirm__).toHaveBeenCalled();
    expect((globalThis as any).__mockDeleteUserMutation__.mutateAsync).not.toHaveBeenCalled();
  });

  it('should show loading spinner when deleting user', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    const firstDeleteButton = deleteButtons[0].closest('button');

    // Start deletion
    const clickPromise = user.click(firstDeleteButton!);

    // Wait for state update
    await waitFor(() => {
      const buttons = screen.getAllByTestId('button');
      const deleteButton = buttons.find((btn) => btn.querySelector('[data-testid="icon-refresh-cw"]'));
      expect(deleteButton).toBeDefined();
    });

    await clickPromise;
  });

  it('should show alert on delete error', async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockDeleteUserMutation__.mutateAsync.mockRejectedValue(new Error('Delete failed'));

    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    const firstDeleteButton = deleteButtons[0].closest('button');

    await user.click(firstDeleteButton!);

    await waitFor(() => {
      expect((globalThis as any).__mockAlert__).toHaveBeenCalledWith('Failed to delete user. Please try again.');
    });
  });

  it('should call purge cache API when purge cache button is clicked', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');

    await user.click(purgeButton!);

    expect((globalThis as any).__mockConfirm__).toHaveBeenCalledWith('Are you sure you want to purge the cache?');
    expect((globalThis as any).__mockUsersApiCachePurge__).toHaveBeenCalled();
  });

  it('should invalidate queries after successful cache purge', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');

    await user.click(purgeButton!);

    await waitFor(() => {
      expect((globalThis as any).__mockQueryClient__.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['users', 'list'],
      });
      expect((globalThis as any).__mockAlert__).toHaveBeenCalledWith('Cache purged successfully');
    });
  });

  it('should show alert on purge cache error', async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockUsersApiCachePurge__.mockResolvedValue({ ok: false });

    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');

    await user.click(purgeButton!);

    await waitFor(() => {
      expect((globalThis as any).__mockAlert__).toHaveBeenCalledWith('Failed to purge cache');
    });
  });

  it('should not purge cache when confirm returns false', async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockConfirm__.mockReturnValue(false);

    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');

    await user.click(purgeButton!);

    expect((globalThis as any).__mockConfirm__).toHaveBeenCalled();
    expect((globalThis as any).__mockUsersApiCachePurge__).not.toHaveBeenCalled();
  });

  it('should show loading spinner when purging cache', async () => {
    const user = userEvent.setup();
    const timeout = (resolve: (value: unknown) => void) => setTimeout(() => resolve({ ok: true }), 100)
    const mockImplementation = () => new Promise((resolve) => timeout(resolve));
    (globalThis as any).__mockUsersApiCachePurge__.mockImplementation(mockImplementation);

    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache');

    const clickPromise = user.click(purgeButton!);

    await waitFor(() => {
      const spinner = purgeButton?.querySelector('[data-testid="icon-refresh-cw"]');
      expect(spinner).toBeDefined();
    });

    await clickPromise;
  });

  it('should render empty state when no users', () => {
    (globalThis as any).__mockUseUsersSuspense__.mockReturnValue({
      data: { users: [] },
    });

    render(<route.component />);

    expect(screen.getByText('No users found')).toBeDefined();
    expect(screen.getByText('Invite First User')).toBeDefined();
    expect(screen.getByTestId('icon-users')).toBeDefined();
  });

  it('should not render empty state when users exist', () => {
    render(<route.component />);

    const emptyState = screen.queryByText('No users found');
    expect(emptyState).toBeNull();
  });

  it('should render user count in description', () => {
    render(<route.component />);

    expect(screen.getByText(/Total: 3/)).toBeDefined();
  });

  it('should render user with null name as question mark in avatar', () => {
    (globalThis as any).__mockUseUsersSuspense__.mockReturnValue({
      data: {
        users: [
          {
            id: '4',
            name: null,
            email: 'noname@example.com',
            emailVerified: false,
            role: 'user',
            banned: false,
            image: null,
          },
        ],
      },
    });

    const { container } = render(<route.component />);

    const avatars = container.querySelectorAll(String.raw`.rounded-full.bg-primary\/10`);
    const avatarWithQuestionMark = Array.from(avatars).find((avatar) => avatar.textContent === '?');
    expect(avatarWithQuestionMark).toBeDefined();
  });

  it('should render user with empty string name as question mark in avatar', () => {
    (globalThis as any).__mockUseUsersSuspense__.mockReturnValue({
      data: {
        users: [
          {
            id: '5',
            name: '',
            email: 'emptyname@example.com',
            emailVerified: false,
            role: 'user',
            banned: false,
            image: null,
          },
        ],
      },
    });

    const { container } = render(<route.component />);

    const avatars = container.querySelectorAll(String.raw`.rounded-full.bg-primary\/10`);
    const avatarWithQuestionMark = Array.from(avatars).find((avatar) => avatar.textContent === '?');
    expect(avatarWithQuestionMark).toBeDefined();
  });

  it('should disable delete button when deleting that user', async () => {
    const user = userEvent.setup();
    render(<route.component />);

    const deleteButtons = screen.getAllByTestId('icon-trash2');
    const firstDeleteButton = deleteButtons[0].closest('button');

    const clickPromise = user.click(firstDeleteButton!);

    await waitFor(() => {
      expect(firstDeleteButton?.disabled).toBe(true);
    });

    await clickPromise;
  });

  it('should disable purge cache button when purging', async () => {
    const user = userEvent.setup();
    const timeout = (resolve: (value: unknown) => void) => setTimeout(() => resolve({ ok: true }), 100)
    const mockImplementation = () => new Promise((resolve) => timeout(resolve));
    (globalThis as any).__mockUsersApiCachePurge__.mockImplementation(mockImplementation);

    render(<route.component />);

    const buttons = screen.getAllByRole('button');
    const purgeButton = buttons.find((btn) => btn.getAttribute('title') === 'Purge Cache') as HTMLButtonElement;

    const clickPromise = user.click(purgeButton);

    await waitFor(() => {
      expect(purgeButton.disabled).toBe(true);
    });

    await clickPromise;
  });

  it('should call translation function for all text elements', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.users.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.users.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.users.all');
  });
});
