import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'app.settings.title': 'Settings',
    'app.settings.description': 'Manage your account settings and preferences',
    'app.settings.profile.title': 'Profile Settings',
    'app.settings.profile.description': 'Update your personal information',
    'app.settings.profile.name': 'Name',
    'app.settings.profile.email': 'Email',
    'app.settings.profile.emailHint': 'Email cannot be changed',
    'app.settings.profile.save': 'Save Changes',
    'app.settings.security.title': 'Security',
    'app.settings.security.description': 'Change your password',
    'app.settings.security.currentPassword': 'Current Password',
    'app.settings.security.newPassword': 'New Password',
    'app.settings.security.confirmPassword': 'Confirm Password',
    'app.settings.security.update': 'Update Password',
    'app.settings.danger.title': 'Danger Zone',
    'app.settings.danger.description': 'Irreversible and destructive actions',
    'app.settings.danger.deleteAccount': 'Delete Account',
    'app.settings.danger.deleteAccountDescription': 'Permanently delete your account and all data',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockSession = {
  data: {
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    },
  },
  isPending: false,
};

const mockUseSession = vi.fn().mockReturnValue(mockSession);

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockUseSession__ = mockUseSession;

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

// Mock auth-client
vi.mock('@/shared/infrastructure/lib/auth-client', () => ({
  useSession: () => (globalThis as any).__mockUseSession__(),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');

  return {
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
      update: function (c: any) { Object.assign(this, c); return this; },
      _addFileChildren: function (c: any) { return this; },
      _addFileTypes: function () { return this; },
    })),
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

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, className, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        className,
        ...props,
      }, children);
    },
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

// Mock Input component
vi.mock('@/shared/infrastructure/ui/input', () => ({
  Input: ({ id, type, defaultValue, disabled, ...props }: any) => (
    <input
      data-testid="input"
      id={id}
      type={type}
      defaultValue={defaultValue}
      disabled={disabled}
      {...props}
    />
  ),
}));

// Mock Label component
vi.mock('@/shared/infrastructure/ui/label', () => ({
  Label: ({ htmlFor, children, ...props }: any) => (
    <label data-testid="label" htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}));

// Mock Separator component
vi.mock('@/shared/infrastructure/ui/separator', () => ({
  Separator: ({ className, ...props }: any) => (
    <hr data-testid="separator" className={className} {...props} />
  ),
}));

// Mock LanguageSwitcher component
vi.mock('@/shared/infrastructure/ui/language-switcher', () => ({
  LanguageSwitcher: ({ variant }: { variant?: string }) => (
    <div data-testid="language-switcher" data-variant={variant}>
      Language Switcher
    </div>
  ),
}));

// Import after mocks are set up
import { settingsIndexRoute as Route } from '@/features/settings/presentation/routing';

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
    expect(route.id).toBe('/');
  });
});

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockUseSession__.mockReturnValue(mockSession);
    (globalThis as any).__mockT__.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'app.settings.title': 'Settings',
        'app.settings.description': 'Manage your account settings and preferences',
        'app.settings.profile.title': 'Profile Settings',
        'app.settings.profile.description': 'Update your personal information',
        'app.settings.profile.name': 'Name',
        'app.settings.profile.email': 'Email',
        'app.settings.profile.emailHint': 'Email cannot be changed',
        'app.settings.profile.save': 'Save Changes',
        'app.settings.security.title': 'Security',
        'app.settings.security.description': 'Change your password',
        'app.settings.security.currentPassword': 'Current Password',
        'app.settings.security.newPassword': 'New Password',
        'app.settings.security.confirmPassword': 'Confirm Password',
        'app.settings.security.update': 'Update Password',
        'app.settings.danger.title': 'Danger Zone',
        'app.settings.danger.description': 'Irreversible and destructive actions',
        'app.settings.danger.deleteAccount': 'Delete Account',
        'app.settings.danger.deleteAccountDescription': 'Permanently delete your account and all data',
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);

    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('should render header with title', () => {
    render(<route.component />);

    const title = screen.getByText('Settings');
    expect(title).toBeDefined();
    expect(title.tagName).toBe('H1');
    expect(title.className).toContain('text-3xl');
  });

  it('should render header with description', () => {
    render(<route.component />);

    const description = screen.getByText('Manage your account settings and preferences');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should render Profile Settings card', () => {
    render(<route.component />);

    expect(screen.getByText('Profile Settings')).toBeDefined();
    expect(screen.getByText('Update your personal information')).toBeDefined();
  });

  it('should render name input with label', () => {
    render(<route.component />);

    const nameLabel = screen.getByText('Name');
    expect(nameLabel).toBeDefined();
    expect((nameLabel as HTMLLabelElement).htmlFor).toBe('name');

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput).toBeDefined();
    expect(nameInput.id).toBe('name');
    expect(nameInput.type).toBe('text'); // text is default
  });

  it('should render name input with user name as default value', () => {
    render(<route.component />);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.defaultValue).toBe('Test User');
  });

  it('should render name input with empty default value when session is null', () => {
    (globalThis as any).__mockUseSession__.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<route.component />);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.defaultValue).toBe('');
  });

  it('should render email input with label', () => {
    render(<route.component />);

    const emailLabel = screen.getByText('Email');
    expect(emailLabel).toBeDefined();
    expect((emailLabel as HTMLLabelElement).htmlFor).toBe('email');

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput).toBeDefined();
    expect(emailInput.id).toBe('email');
    expect(emailInput.type).toBe('email');
  });

  it('should render email input as disabled', () => {
    render(<route.component />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.disabled).toBe(true);
  });

  it('should render email input with user email as default value', () => {
    render(<route.component />);

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.defaultValue).toBe('test@example.com');
  });

  it('should render email hint text', () => {
    render(<route.component />);

    expect(screen.getByText('Email cannot be changed')).toBeDefined();
  });

  it('should render language switcher', () => {
    render(<route.component />);

    const languageSwitcher = screen.getByTestId('language-switcher');
    expect(languageSwitcher).toBeDefined();
    expect(languageSwitcher.getAttribute('data-variant')).toBeNull(); // default variant
  });

  it('should render Save Changes button in Profile Settings', () => {
    render(<route.component />);

    const saveButton = screen.getByText('Save Changes');
    expect(saveButton).toBeDefined();
    expect(saveButton.closest('[data-testid="button"]')).toBeDefined();
  });

  it('should render Security Settings card', () => {
    render(<route.component />);

    expect(screen.getByText('Security')).toBeDefined();
    expect(screen.getByText('Change your password')).toBeDefined();
  });

  it('should render current password input', () => {
    render(<route.component />);

    const currentPasswordLabel = screen.getByText('Current Password');
    expect(currentPasswordLabel).toBeDefined();
    expect((currentPasswordLabel as HTMLLabelElement).htmlFor).toBe('current-password');

    const currentPasswordInput = screen.getByLabelText('Current Password') as HTMLInputElement;
    expect(currentPasswordInput).toBeDefined();
    expect(currentPasswordInput.id).toBe('current-password');
    expect(currentPasswordInput.type).toBe('password');
  });

  it('should render new password input', () => {
    render(<route.component />);

    const newPasswordLabel = screen.getByText('New Password');
    expect(newPasswordLabel).toBeDefined();
    expect((newPasswordLabel as HTMLLabelElement).htmlFor).toBe('new-password');

    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    expect(newPasswordInput).toBeDefined();
    expect(newPasswordInput.id).toBe('new-password');
    expect(newPasswordInput.type).toBe('password');
  });

  it('should render confirm password input', () => {
    render(<route.component />);

    const confirmPasswordLabel = screen.getByText('Confirm Password');
    expect(confirmPasswordLabel).toBeDefined();
    expect((confirmPasswordLabel as HTMLLabelElement).htmlFor).toBe('confirm-password');

    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    expect(confirmPasswordInput).toBeDefined();
    expect(confirmPasswordInput.id).toBe('confirm-password');
    expect(confirmPasswordInput.type).toBe('password');
  });

  it('should render Update Password button in Security Settings', () => {
    render(<route.component />);

    const updateButton = screen.getByText('Update Password');
    expect(updateButton).toBeDefined();
    expect(updateButton.closest('[data-testid="button"]')).toBeDefined();
  });

  it('should render Danger Zone card', () => {
    render(<route.component />);

    expect(screen.getByText('Danger Zone')).toBeDefined();
    expect(screen.getByText('Irreversible and destructive actions')).toBeDefined();
  });

  it('should render Danger Zone card with destructive styling', () => {
    const { container } = render(<route.component />);

    const dangerCard = container.querySelector('.border-destructive\\/50');
    expect(dangerCard).toBeDefined();

    const dangerTitle = dangerCard?.querySelector('.text-destructive');
    expect(dangerTitle).toBeDefined();
    expect(dangerTitle?.textContent).toBe('Danger Zone');
  });

  it('should render separator in Danger Zone', () => {
    const { container } = render(<route.component />);

    const dangerCard = container.querySelector('.border-destructive\\/50');
    const separator = dangerCard?.querySelector('[data-testid="separator"]');
    expect(separator).toBeDefined();
  });

  it('should render delete account section', () => {
    render(<route.component />);

    expect(screen.getAllByText('Delete Account').length).toBe(2); // Title and button
    expect(screen.getByText('Permanently delete your account and all data')).toBeDefined();
  });

  it('should render delete account button with destructive variant', () => {
    render(<route.component />);

    const deleteButtons = screen.getAllByText('Delete Account');
    const deleteButton = deleteButtons.find((btn) =>
      btn.closest('[data-testid="button"]')?.getAttribute('data-variant') === 'destructive'
    );
    expect(deleteButton).toBeDefined();
  });

  it('should render all three settings cards', () => {
    const { container } = render(<route.component />);

    const cards = container.querySelectorAll('[data-testid="card"]');
    expect(cards.length).toBe(3); // Profile, Security, Danger Zone
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);

    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.name');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.email');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.emailHint');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.profile.save');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.currentPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.newPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.confirmPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.security.update');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.danger.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.danger.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.danger.deleteAccount');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('app.settings.danger.deleteAccountDescription');
  });

  it('should use session data for form inputs', () => {
    render(<route.component />);

    expect((globalThis as any).__mockUseSession__).toHaveBeenCalled();
  });

  it('should render all form inputs', () => {
    render(<route.component />);

    const inputs = screen.getAllByTestId('input');
    expect(inputs.length).toBe(5); // name, email, current-password, new-password, confirm-password
  });

  it('should render all labels', () => {
    render(<route.component />);

    const labels = screen.getAllByTestId('label');
    expect(labels.length).toBeGreaterThanOrEqual(5); // At least 5 labels for inputs
  });

  it('should render all buttons', () => {
    render(<route.component />);

    const buttons = screen.getAllByTestId('button');
    expect(buttons.length).toBe(3); // Save Changes, Update Password, Delete Account
  });
});
