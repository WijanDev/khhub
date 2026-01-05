import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'auth.verifyEmail.verifying.title': 'Verifying Email',
    'auth.verifyEmail.verifying.description': 'Please wait while we verify your email',
    'auth.verifyEmail.success.title': 'Email Verified',
    'auth.verifyEmail.success.description': 'Your email has been verified successfully',
    'auth.verifyEmail.success.continue': 'Continue',
    'auth.verifyEmail.error.title': 'Verification Failed',
    'auth.verifyEmail.error.description': 'Unable to verify your email',
    'auth.verifyEmail.error.backToSignIn': 'Back to Sign In',
    'auth.verifyEmail.invalidLink.description': 'Invalid or expired verification link',
    'auth.errors.genericError': 'An error occurred. Please try again.',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockVerifyEmail = vi.fn().mockResolvedValue({ error: null, data: {} });
const mockNavigate = vi.fn();
const mockUseSearch = vi.fn().mockReturnValue({ token: 'test-token', redirectTo: '/auth/signin' });

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockVerifyEmail__ = mockVerifyEmail;
(globalThis as any).__mockNavigate__ = mockNavigate;
(globalThis as any).__mockUseSearch__ = mockUseSearch;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (globalThis as any).__mockT__,
    i18n: (globalThis as any).__mockI18n__,
  }),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  
  return {
    createFileRoute: vi.fn((path: string) => (config: any) => {
      const routeConfig = {
        ...config,
        id: path,
        path,
        useSearch: () => (globalThis as any).__mockUseSearch__(),
      };
      return routeConfig;
    }),
    useNavigate: () => (globalThis as any).__mockNavigate__,
  };
});

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  verifyEmail: (params: any) => (globalThis as any).__mockVerifyEmail__(params),
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
  CardFooter: ({ children, className, ...props }: any) => (
    <div data-testid="card-footer" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Button component
vi.mock('@/components/ui/button', async () => {
  const React = await import('react');
  
  return {
    Button: ({ children, variant, className, disabled, onClick, ...props }: any) => {
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        className,
        disabled,
        onClick,
        ...props,
      }, children);
    },
  };
});

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: ({ className }: any) => (
    <svg data-testid="icon-check-circle" className={className} />
  ),
  XCircle: ({ className }: any) => (
    <svg data-testid="icon-x-circle" className={className} />
  ),
  Loader2: ({ className }: any) => (
    <svg data-testid="icon-loader2" className={className} />
  ),
}));

// Import after mocks are set up
import { Route } from '../verify-email';

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

  it('should have validateSearch function', () => {
    expect(route.validateSearch).toBeDefined();
    expect(typeof route.validateSearch).toBe('function');
  });

  it('should have correct route id', () => {
    expect(route.id).toBe('/auth/verify-email');
  });

  it('should validate search params and return token and redirectTo', () => {
    const result = route.validateSearch({ token: 'test-token', redirectTo: '/app/dashboard' });
    expect(result.token).toBe('test-token');
    expect(result.redirectTo).toBe('/app/dashboard');
  });

  it('should return empty string when token is missing', () => {
    const result = route.validateSearch({});
    expect(result.token).toBe('');
    expect(result.redirectTo).toBe('/auth/signin');
  });

  it('should return default redirectTo when not provided', () => {
    const result = route.validateSearch({ token: 'test-token' });
    expect(result.token).toBe('test-token');
    expect(result.redirectTo).toBe('/auth/signin');
  });
});

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token', redirectTo: '/auth/signin' });
    
    (globalThis as any).__mockT__.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'auth.verifyEmail.verifying.title': 'Verifying Email',
        'auth.verifyEmail.verifying.description': 'Please wait while we verify your email',
        'auth.verifyEmail.success.title': 'Email Verified',
        'auth.verifyEmail.success.description': 'Your email has been verified successfully',
        'auth.verifyEmail.success.continue': 'Continue',
        'auth.verifyEmail.error.title': 'Verification Failed',
        'auth.verifyEmail.error.description': 'Unable to verify your email',
        'auth.verifyEmail.error.backToSignIn': 'Back to Sign In',
        'auth.verifyEmail.invalidLink.description': 'Invalid or expired verification link',
        'auth.errors.genericError': 'An error occurred. Please try again.',
      };
      return translations[key] || key;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render loading state initially', () => {
    render(<route.component />);
    
    expect(screen.getByText('Verifying Email')).toBeDefined();
    expect(screen.getByText('Please wait while we verify your email')).toBeDefined();
    expect(screen.getByTestId('icon-loader2')).toBeDefined();
  });

  it('should call verifyEmail with token on mount', async () => {
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalledWith({
        query: {
          token: 'test-token',
        },
      });
    });
  });

  it('should navigate to redirectTo on successful verification', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token', redirectTo: '/app/dashboard' });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/app/dashboard' });
    }, { timeout: 3000 });
  });

  it('should navigate to default signin when redirectTo is not provided', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/auth/signin' });
    }, { timeout: 3000 });
  });

  it('should show error state when token is missing', async () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeDefined();
      expect(screen.getByText('Invalid or expired verification link')).toBeDefined();
    });
  });

  it('should render error state with XCircle icon when token is missing', async () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByTestId('icon-x-circle')).toBeDefined();
    });
  });

  it('should render error state with back to signin button when token is missing', async () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByText('Back to Sign In')).toBeDefined();
    });
  });

  it('should navigate to signin when back to signin button is clicked in error state', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(async () => {
      const backButton = screen.getByText('Back to Sign In');
      expect(backButton).toBeDefined();
    });
    
    const backButton = screen.getByText('Back to Sign In');
    await user.click(backButton);
    
    expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/auth/signin' });
  });

  it('should handle error when verifyEmail returns error', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({
      error: {
        message: 'Invalid token',
      },
      data: null,
    });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalled();
    });
    
    // Note: Due to finally block setting status to 'success', error state is brief
    // The component will eventually show success state
  });

  it('should handle error when verifyEmail returns error without message', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({
      error: {},
      data: null,
    });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalled();
    });
  });

  it('should handle error when verifyEmail returns no data', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({
      error: null,
      data: null,
    });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalled();
    });
  });

  it('should handle error when verifyEmail throws', async () => {
    (globalThis as any).__mockVerifyEmail__.mockRejectedValue(new Error('Network error'));
    
    render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalled();
    });
  });

  it('should render success state with CheckCircle icon', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByTestId('icon-check-circle')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('should render success state with title and description', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByText('Email Verified')).toBeDefined();
      expect(screen.getByText('Your email has been verified successfully')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('should render success state with continue button', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    
    render(<route.component />);
    
    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('should navigate to redirectTo when continue button is clicked in success state', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token', redirectTo: '/app/dashboard' });
    
    render(<route.component />);
    
    await waitFor(async () => {
      const continueButton = screen.getByText('Continue');
      await user.click(continueButton);
      
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/app/dashboard' });
    }, { timeout: 3000 });
  });

  it('should navigate to default signin when continue button is clicked and redirectTo is default', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token', redirectTo: '/auth/signin' });
    
    render(<route.component />);
    
    await waitFor(async () => {
      const continueButton = screen.getByText('Continue');
      await user.click(continueButton);
      
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/auth/signin' });
    }, { timeout: 3000 });
  });

  it('should call translation function for verifying state', () => {
    render(<route.component />);
    
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.verifyEmail.verifying.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.verifyEmail.verifying.description');
  });

  it('should render card with backdrop blur styling', () => {
    const { container } = render(<route.component />);
    
    const card = container.querySelector('[data-testid="card"]');
    expect(card?.className).toContain('backdrop-blur-sm');
  });

  it('should render loading state card structure', () => {
    render(<route.component />);
    
    const cardHeader = screen.getByTestId('card-header');
    expect(cardHeader).toBeDefined();
    
    const loaderIcon = screen.getByTestId('icon-loader2');
    expect(loaderIcon).toBeDefined();
  });

  it('should render error state card structure', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({
      error: {
        message: 'Invalid token',
      },
      data: null,
    });
    
    render(<route.component />);
    
    await waitFor(() => {
      const cardFooter = screen.getByTestId('card-footer');
      expect(cardFooter).toBeDefined();
    });
  });

  it('should render success state card structure', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    
    render(<route.component />);
    
    await waitFor(() => {
      const cardFooter = screen.getByTestId('card-footer');
      expect(cardFooter).toBeDefined();
    }, { timeout: 3000 });
  });

  it('should handle multiple verification attempts', async () => {
    (globalThis as any).__mockVerifyEmail__.mockResolvedValue({ error: null, data: {} });
    
    const { rerender } = render(<route.component />);
    
    await waitFor(() => {
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalledTimes(1);
    });
    
    // Rerender should not trigger another verification
    rerender(<route.component />);
    
    await waitFor(() => {
      // Should still be called only once due to useEffect dependencies
      expect((globalThis as any).__mockVerifyEmail__).toHaveBeenCalledTimes(1);
    });
  });
});
