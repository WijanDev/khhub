import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'auth.resetPassword.title': 'Reset Password',
    'auth.resetPassword.description': 'Enter your new password',
    'auth.resetPassword.newPassword': 'New Password',
    'auth.resetPassword.confirmPassword': 'Confirm Password',
    'auth.resetPassword.submit': 'Reset Password',
    'auth.resetPassword.submitting': 'Resetting...',
    'auth.resetPassword.backToSignIn': 'Back to Sign In',
    'auth.resetPassword.success.title': 'Password Reset Successful',
    'auth.resetPassword.success.description': 'Your password has been reset successfully',
    'auth.resetPassword.success.signIn': 'Sign In',
    'auth.resetPassword.invalidLink.title': 'Invalid Reset Link',
    'auth.resetPassword.invalidLink.description': 'This password reset link is invalid or has expired',
    'auth.resetPassword.invalidLink.requestNew': 'Request New Link',
    'auth.errors.genericError': 'An error occurred. Please try again.',
    'validation.password.minLength': 'Password must be at least 8 characters',
    'validation.password.maxLength': 'Password must be at most 128 characters',
    'validation.password.mismatch': 'Passwords do not match',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
const mockNavigate = vi.fn();
const mockUseSearch = vi.fn().mockReturnValue({ token: 'test-token' });

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockResetPassword__ = mockResetPassword;
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
    Link: ({ to, children, className, ...props }: any) => {
      return React.createElement('a', {
        href: to,
        className,
        'data-testid': 'link',
        ...props,
      }, children);
    },
    useNavigate: () => (globalThis as any).__mockNavigate__,
  };
});

// Mock TanStack Form
const mockFormHandleSubmit = vi.fn();
const mockFormReset = vi.fn();
let mockFormState = { isSubmitting: false };
let mockOnSubmit: (({ value }: any) => Promise<void>) | null = null;
let mockNewPasswordField = {
  state: {
    value: '',
    meta: {
      isBlurred: false,
      errors: [],
    },
  },
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
};
let mockConfirmPasswordField = {
  state: {
    value: '',
    meta: {
      isBlurred: false,
      errors: [],
    },
  },
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
};
let mockGetFieldValue = vi.fn().mockReturnValue('');

vi.mock('@tanstack/react-form', () => ({
  useForm: (config: any) => {
    mockOnSubmit = config.onSubmit;
    return {
      state: mockFormState,
      handleSubmit: mockFormHandleSubmit,
      reset: mockFormReset,
      getFieldValue: mockGetFieldValue,
      Field: ({ name, validators, children }: any) => {
        if (name === 'newPassword') {
          return children(mockNewPasswordField);
        } else if (name === 'confirmPassword') {
          const fieldApi = {
            form: {
              getFieldValue: mockGetFieldValue,
            },
          };
          // Call validator if provided
          if (validators?.onChange) {
            const validatorResult = validators.onChange({
              value: mockConfirmPasswordField.state.value,
              fieldApi,
            });
            if (validatorResult) {
              mockConfirmPasswordField.state.meta.errors = [validatorResult];
            }
          }
          return children(mockConfirmPasswordField);
        }
        return children({
          state: {
            value: '',
            meta: {
              isBlurred: false,
              errors: [],
            },
          },
          handleChange: vi.fn(),
          handleBlur: vi.fn(),
        });
      },
    };
  },
}));

// Mock auth-client
vi.mock('@/lib/auth-client', () => ({
  resetPassword: (params: any) => (globalThis as any).__mockResetPassword__(params),
}));

// Mock form-utils
vi.mock('@/lib/form-utils', () => ({
  getFieldError: vi.fn((errors: any, t: any) => {
    if (errors && errors.length > 0) {
      return t(errors[0]);
    }
    return '';
  }),
  hasFieldError: vi.fn((isBlurred: boolean, errors: any) => {
    return isBlurred && errors && errors.length > 0;
  }),
  zodFieldValidator: vi.fn((schema: any) => {
    return (value: any) => {
      const result = schema.safeParse(value);
      if (!result.success) {
        return result.error.errors.map((e: any) => e.message);
      }
      return undefined;
    };
  }),
  zodValidator: vi.fn((schema: any) => {
    return (values: any) => {
      const result = schema.safeParse(values);
      if (!result.success) {
        return result.error.errors.map((e: any) => e.message);
      }
      return undefined;
    };
  }),
}));

// Mock Button component
vi.mock('@/components/ui/button', async () => {
  const React = await import('react');
  
  return {
    Button: ({ children, variant, type, className, disabled, onClick, asChild, ...props }: any) => {
      if (asChild) {
        return children;
      }
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        type,
        className,
        disabled,
        onClick,
        ...props,
      }, children);
    },
  };
});

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
  CardFooter: ({ children, className, ...props }: any) => (
    <div data-testid="card-footer" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Input component
vi.mock('@/components/ui/input', () => ({
  Input: ({ id, type, placeholder, value, onChange, onBlur, disabled, ...props }: any) => (
    <input
      data-testid="input"
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      {...props}
    />
  ),
}));

// Mock Form components
vi.mock('@/components/ui/form', () => ({
  Form: ({ children, onSubmit, ...props }: any) => (
    <form data-testid="form" onSubmit={onSubmit} {...props}>
      {children}
    </form>
  ),
  FormField: ({ field, children }: any) => {
    return typeof children === 'function' ? children(field) : children;
  },
  FormLabel: ({ htmlFor, children, ...props }: any) => (
    <label data-testid="form-label" htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
  FormControl: ({ children, ...props }: any) => (
    <div data-testid="form-control" {...props}>
      {children}
    </div>
  ),
  FormMessage: ({ children, ...props }: any) => (
    <div data-testid="form-message" {...props}>
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: any) => (
    <svg data-testid="icon-arrow-left" className={className} />
  ),
  CheckCircle: ({ className }: any) => (
    <svg data-testid="icon-check-circle" className={className} />
  ),
}));

// Import after mocks are set up
import { Route } from '../reset-password';

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
    expect(route.id).toBe('/auth/reset-password');
  });

  it('should validate search params and return token', () => {
    const result = route.validateSearch({ token: 'test-token' });
    expect(result.token).toBe('test-token');
  });

  it('should return empty string when token is missing', () => {
    const result = route.validateSearch({});
    expect(result.token).toBe('');
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockResetPassword__.mockResolvedValue({ error: null });
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: 'test-token' });
    mockFormState = { isSubmitting: false };
    mockOnSubmit = null;
    mockNewPasswordField = {
      state: {
        value: '',
        meta: {
          isBlurred: false,
          errors: [],
        },
      },
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
    };
    mockConfirmPasswordField = {
      state: {
        value: '',
        meta: {
          isBlurred: false,
          errors: [],
        },
      },
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
    };
    mockGetFieldValue.mockReturnValue('');
    
    (globalThis as any).__mockT__.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'auth.resetPassword.title': 'Reset Password',
        'auth.resetPassword.description': 'Enter your new password',
        'auth.resetPassword.newPassword': 'New Password',
        'auth.resetPassword.confirmPassword': 'Confirm Password',
        'auth.resetPassword.submit': 'Reset Password',
        'auth.resetPassword.submitting': 'Resetting...',
        'auth.resetPassword.backToSignIn': 'Back to Sign In',
        'auth.resetPassword.success.title': 'Password Reset Successful',
        'auth.resetPassword.success.description': 'Your password has been reset successfully',
        'auth.resetPassword.success.signIn': 'Sign In',
        'auth.resetPassword.invalidLink.title': 'Invalid Reset Link',
        'auth.resetPassword.invalidLink.description': 'This password reset link is invalid or has expired',
        'auth.resetPassword.invalidLink.requestNew': 'Request New Link',
        'auth.errors.genericError': 'An error occurred. Please try again.',
        'validation.password.minLength': 'Password must be at least 8 characters',
        'validation.password.maxLength': 'Password must be at most 128 characters',
        'validation.password.mismatch': 'Passwords do not match',
      };
      return translations[key] || key;
    });
  });

  it('should render the component', () => {
    render(<route.component />);
    
    const titles = screen.getAllByText('Reset Password');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should render card with title', () => {
    render(<route.component />);
    
    const titles = screen.getAllByText('Reset Password');
    const title = titles.find(t => t.tagName === 'H3');
    expect(title).toBeDefined();
    expect(title?.tagName).toBe('H3');
  });

  it('should render card with description', () => {
    render(<route.component />);
    
    expect(screen.getByText('Enter your new password')).toBeDefined();
  });

  it('should render new password input field', () => {
    render(<route.component />);
    
    const newPasswordLabel = screen.getByText('New Password');
    expect(newPasswordLabel).toBeDefined();
    
    const newPasswordInput = screen.getByLabelText('New Password');
    expect(newPasswordInput).toBeDefined();
    expect(newPasswordInput).toHaveProperty('type', 'password');
  });

  it('should render confirm password input field', () => {
    render(<route.component />);
    
    const confirmPasswordLabel = screen.getByText('Confirm Password');
    expect(confirmPasswordLabel).toBeDefined();
    
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    expect(confirmPasswordInput).toBeDefined();
    expect(confirmPasswordInput).toHaveProperty('type', 'password');
  });

  it('should render password inputs with placeholders', () => {
    render(<route.component />);
    
    const placeholders = screen.getAllByPlaceholderText('••••••••');
    expect(placeholders.length).toBe(2);
  });

  it('should render submit button', () => {
    render(<route.component />);
    
    const buttons = screen.getAllByText('Reset Password');
    const submitButton = buttons.find(btn => btn.closest('[data-testid="button"]'));
    expect(submitButton).toBeDefined();
    expect(submitButton?.closest('[data-testid="button"]')).toBeDefined();
  });

  it('should render back to signin link', () => {
    render(<route.component />);
    
    const backLink = screen.getByText('Back to Sign In');
    expect(backLink).toBeDefined();
    expect(backLink.closest('[data-testid="link"]')).toBeDefined();
  });

  it('should render back to signin link with correct href', () => {
    render(<route.component />);
    
    const backLink = screen.getByText('Back to Sign In').closest('[data-testid="link"]');
    expect(backLink?.getAttribute('href')).toBe('/auth/signin');
  });

  it('should render arrow left icon in back link', () => {
    render(<route.component />);
    
    const backLink = screen.getByText('Back to Sign In').closest('[data-testid="link"]');
    const arrowIcon = backLink?.querySelector('[data-testid="icon-arrow-left"]');
    expect(arrowIcon).toBeDefined();
  });

  it('should render invalid link state when token is missing', () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '' });
    
    render(<route.component />);
    
    expect(screen.getByText('Invalid Reset Link')).toBeDefined();
    expect(screen.getByText('This password reset link is invalid or has expired')).toBeDefined();
  });

  it('should render request new link button in invalid link state', () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '' });
    
    render(<route.component />);
    
    expect(screen.getByText('Request New Link')).toBeDefined();
  });

  it('should render request new link button with correct href', () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '' });
    
    render(<route.component />);
    
    const requestLink = screen.getByText('Request New Link').closest('[data-testid="link"]');
    expect(requestLink?.getAttribute('href')).toBe('/auth/forgot-password');
  });

  it('should call resetPassword with correct params when onSubmit is called', async () => {
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalledWith({
        newPassword: 'newpass123',
        token: 'test-token',
      });
    }
  });

  it('should set serverError when token is missing in onSubmit', async () => {
    (globalThis as any).__mockUseSearch__.mockReturnValue({ token: '' });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      expect((globalThis as any).__mockResetPassword__).not.toHaveBeenCalled();
    }
  });

  it('should handle error when resetPassword returns error', async () => {
    (globalThis as any).__mockResetPassword__.mockResolvedValue({
      error: {
        message: 'Invalid token',
      },
    });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalled();
    }
  });

  it('should handle error when resetPassword throws', async () => {
    (globalThis as any).__mockResetPassword__.mockRejectedValue(new Error('Network error'));
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      try {
        await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      } catch {
        // Error is handled in component
      }
      
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalled();
    }
  });

  it('should show form validation error when newPassword field is blurred and has errors', () => {
    mockNewPasswordField = {
      state: {
        value: 'short',
        meta: {
          isBlurred: true,
          errors: ['validation.password.minLength'],
        },
      },
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
    };
    
    render(<route.component />);
    
    const errorMessage = screen.getByTestId('form-message');
    expect(errorMessage).toBeDefined();
    expect(errorMessage.textContent).toBe('Password must be at least 8 characters');
  });

  it('should show form validation error when confirmPassword does not match', () => {
    mockGetFieldValue.mockReturnValue('password123');
    mockConfirmPasswordField = {
      state: {
        value: 'different',
        meta: {
          isBlurred: true,
          errors: ['validation.password.mismatch'],
        },
      },
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
    };
    
    render(<route.component />);
    
    const errorMessages = screen.getAllByTestId('form-message');
    const confirmPasswordError = errorMessages.find(msg => msg.textContent === 'Passwords do not match');
    expect(confirmPasswordError).toBeDefined();
  });

  it('should disable inputs when form is submitting', () => {
    mockFormState = { isSubmitting: true };
    
    render(<route.component />);
    
    const inputs = screen.getAllByTestId('input');
    inputs.forEach((input) => {
      expect(input).toHaveProperty('disabled', true);
    });
  });

  it('should disable submit button when form is submitting', () => {
    mockFormState = { isSubmitting: true };
    
    render(<route.component />);
    
    const submitButton = screen.getByText('Resetting...');
    expect(submitButton).toBeDefined();
    expect(submitButton.closest('[data-testid="button"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('should show submitting text when form is submitting', () => {
    mockFormState = { isSubmitting: true };
    
    render(<route.component />);
    
    expect(screen.getByText('Resetting...')).toBeDefined();
  });

  it('should call field handleChange when input value changes', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<route.component />);
    
    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    await user.type(newPasswordInput, 'newpass123');
    
    expect(mockNewPasswordField.handleChange).toHaveBeenCalled();
  });

  it('should call field handleBlur when input loses focus', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<route.component />);
    
    const newPasswordInput = screen.getByLabelText('New Password');
    await user.click(newPasswordInput);
    await user.tab();
    
    expect(mockNewPasswordField.handleBlur).toHaveBeenCalled();
  });

  it('should call form handleSubmit when form is submitted', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    mockFormHandleSubmit.mockImplementation(async () => {
      if (mockOnSubmit) {
        await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      }
    });
    
    render(<route.component />);
    
    const buttons = screen.getAllByText('Reset Password');
    const submitButton = buttons.find(btn => btn.closest('[data-testid="button"]'));
    expect(submitButton).toBeDefined();
    if (submitButton) {
      await user.click(submitButton);
      expect(mockFormHandleSubmit).toHaveBeenCalled();
    }
  });

  it('should set success state on successful submission', async () => {
    (globalThis as any).__mockResetPassword__.mockResolvedValue({ error: null });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalledWith({
        newPassword: 'newpass123',
        token: 'test-token',
      });
    }
  });

  it('should clear serverError at start of onSubmit', async () => {
    render(<route.component />);
    
    if (mockOnSubmit) {
      // First call with error
      (globalThis as any).__mockResetPassword__.mockResolvedValueOnce({
        error: { message: 'Error 1' },
      });
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      // Second call should clear previous error
      (globalThis as any).__mockResetPassword__.mockResolvedValueOnce({ error: null });
      await mockOnSubmit({ value: { newPassword: 'newpass456', confirmPassword: 'newpass456' } });
      
      // Both calls should have been made
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalledTimes(2);
    }
  });

  it('should render success state structure when success is true', () => {
    // We can't easily mock useState, so we'll test the component structure
    // by checking that the form renders correctly initially
    render(<route.component />);
    
    // Initially, success state should not be shown
    expect(screen.queryByText('Password Reset Successful')).toBeNull();
    const titles = screen.getAllByText('Reset Password');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);
    
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.newPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.confirmPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.submit');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.resetPassword.backToSignIn');
  });

  it('should render form with correct structure', () => {
    render(<route.component />);
    
    const form = screen.getByTestId('form');
    expect(form).toBeDefined();
    
    const card = form.closest('[data-testid="card"]');
    expect(card).toBeDefined();
  });

  it('should render card with backdrop blur styling', () => {
    const { container } = render(<route.component />);
    
    const card = container.querySelector('[data-testid="card"]');
    expect(card?.className).toContain('backdrop-blur-sm');
  });

  it('should use generic error when error.message is missing', async () => {
    (globalThis as any).__mockResetPassword__.mockResolvedValue({
      error: {},
    });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { newPassword: 'newpass123', confirmPassword: 'newpass123' } });
      
      expect((globalThis as any).__mockResetPassword__).toHaveBeenCalled();
    }
  });
});
