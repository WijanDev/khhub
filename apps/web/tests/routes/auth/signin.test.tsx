import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'auth.signIn.title': 'Sign In',
    'auth.signIn.description': 'Enter your credentials to sign in',
    'auth.signIn.email': 'Email',
    'auth.signIn.password': 'Password',
    'auth.signIn.forgotPassword': 'Forgot password?',
    'auth.signIn.submit': 'Sign In',
    'auth.signIn.submitting': 'Signing in...',
    'auth.signIn.noAccount': "Don't have an account?",
    'auth.signIn.createAccount': 'Create account',
    'auth.errors.emailNotVerified': 'Email not verified',
    'auth.errors.invalidCredentials': 'Invalid credentials',
    'auth.errors.genericError': 'An error occurred. Please try again.',
    'auth.errors.emailVerificationRequired': 'Email verification required',
    'auth.emailVerification.description': 'Please verify your email address',
    'auth.emailVerification.resend': 'Resend verification email',
    'auth.emailVerification.resending': 'Resending...',
    'auth.emailVerification.resendSuccess': 'Verification email sent successfully',
    'auth.emailVerification.resendError': 'Failed to send verification email',
    'auth.signUp.success.title': 'Account Created',
    'auth.signUp.success.description': 'Please verify your email {{email}}',
    'auth.signUp.success.verifyTitle': 'Verify your email',
    'auth.signUp.success.verifyDescription': 'Click the link in your email to verify your account',
    'auth.signUp.success.signIn': 'Sign In',
  };
  return translations[key] || key;
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockSignInEmail = vi.fn().mockResolvedValue({ error: null });
const mockSendVerificationEmail = vi.fn().mockResolvedValue({ error: null });
const mockNavigate = vi.fn();

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockSignInEmail__ = mockSignInEmail;
(globalThis as any).__mockSendVerificationEmail__ = mockSendVerificationEmail;
(globalThis as any).__mockNavigate__ = mockNavigate;

// SONAR
const TEST_PASSWORD = 'password123';


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
let mockFormState = { isSubmitting: false, values: { email: '', password: '' } };
let mockOnSubmit: (({ value }: any) => Promise<void>) | null = null;
let mockEmailField: any = {
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
let mockPasswordField: any = {
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

vi.mock('@tanstack/react-form', () => ({
  useForm: (config: any) => {
    mockOnSubmit = config.onSubmit;
    return {
      state: mockFormState,
      handleSubmit: mockFormHandleSubmit,
      reset: mockFormReset,
      Field: ({ name, validators, children }: any) => {
        if (name === 'email') {
          return children(mockEmailField);
        } else if (name === 'password') {
          return children(mockPasswordField);
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
vi.mock('@/shared/infrastructure/lib/auth-client', () => ({
  signIn: {
    email: (params: any) => (globalThis as any).__mockSignInEmail__(params),
  },
  sendVerificationEmail: (params: any) => (globalThis as any).__mockSendVerificationEmail__(params),
}));

// Mock form-utils
vi.mock('@/shared/infrastructure/lib/form-utils', () => ({
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

// Mock shared SignInSchema
vi.mock('@khhub/shared', () => {
  const mockSchema = {
    shape: {
      email: {},
      password: {},
      name: {},
      confirmPassword: {},
      token: {},
    },
    extend: vi.fn().mockReturnThis(),
    pick: vi.fn().mockReturnThis(),
    omit: vi.fn().mockReturnThis(),
    refine: vi.fn().mockReturnThis(),
    superRefine: vi.fn().mockReturnThis(),
    transform: vi.fn().mockReturnThis(),
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  };
  return {
    SignInSchema: mockSchema,
    SignUpSchema: mockSchema,
    ForgotPasswordSchema: mockSchema,
    ResetPasswordSchema: mockSchema,
  };
});

// Mock Button component
vi.mock('@/shared/infrastructure/ui/button', async () => {
  const React = await import('react');

  return {
    Button: ({ children, variant, type, size, className, disabled, onClick, asChild, ...props }: any) => {
      if (asChild) return children;
      return React.createElement('button', {
        'data-testid': 'button',
        'data-variant': variant,
        'data-size': size,
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
  CardFooter: ({ children, className, ...props }: any) => (
    <div data-testid="card-footer" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock Input component
vi.mock('@/shared/infrastructure/ui/input', () => ({
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
vi.mock('@/shared/infrastructure/ui/form', () => ({
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

// Import after mocks are set up
import { signInRoute as Route } from '@/features/auth/presentation/routing';

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
    expect(route.id).toBe('/signin');
  });
});

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockSignInEmail__.mockResolvedValue({ error: null });
    (globalThis as any).__mockSendVerificationEmail__.mockResolvedValue({ error: null });
    // Reset mock states
    mockEmailField.state.meta.errors = [];
    mockPasswordField.state.meta.errors = [];
  });

  it('should render the component', () => {
    render(<route.component />);
    const signInTexts = screen.getAllByText('Sign In');
    expect(signInTexts.length).toBeGreaterThan(0);
  });

  it('should render form with correct structure', () => {
    render(<route.component />);
    const form = screen.getByTestId('form');
    expect(form).toBeDefined();
    // AuthCard (Card) is now inside Form
    const card = screen.getByTestId('card');
    expect(card).toBeDefined();
    expect(form.contains(card)).toBe(true);
  });

  it('should call signIn.email with correct params when onSubmit is called', async () => {
    render(<route.component />);
    const onSubmit = mockOnSubmit;
    if (onSubmit) {
      await act(async () => {
        await onSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      });
      expect((globalThis as any).__mockSignInEmail__).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: TEST_PASSWORD,
      });
    }
  });

  it('should navigate to dashboard on successful sign in', async () => {
    (globalThis as any).__mockSignInEmail__.mockResolvedValue({ error: null });
    render(<route.component />);
    const onSubmit = mockOnSubmit;
    if (onSubmit) {
      await act(async () => {
        await onSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      });
      expect((globalThis as any).__mockNavigate__).toHaveBeenCalledWith({ to: '/app/dashboard' });
    }
  });

  it('should show email verification card when result.error is related to email verification', async () => {
    (globalThis as any).__mockSignInEmail__.mockResolvedValue({
      error: { message: 'email verification required' }
    });
    render(<route.component />);
    const onSubmit = mockOnSubmit;
    if (onSubmit) {
      await act(async () => {
        await onSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      });
      await waitFor(() => {
        expect(screen.getByText('Account Created')).toBeDefined();
      });
    }
  });

  it('should show email verification card when result.error is a string related to email verification', async () => {
    // This tests the JSON.stringify(result.error) logic
    (globalThis as any).__mockSignInEmail__.mockResolvedValue({
      error: 'not verified email'
    });
    render(<route.component />);
    const onSubmit = mockOnSubmit;
    if (onSubmit) {
      await act(async () => {
        await onSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      });
      await waitFor(() => {
        expect(screen.getByText('Account Created')).toBeDefined();
      });
    }
  });

  it('should show email verification card when signIn.email throws an error related to email verification', async () => {
    (globalThis as any).__mockSignInEmail__.mockRejectedValue(new Error('Email is not verified'));
    render(<route.component />);
    const onSubmit = mockOnSubmit;
    if (onSubmit) {
      await act(async () => {
        await onSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      });
      await waitFor(() => {
        expect(screen.getByText('Account Created')).toBeDefined();
      });
    }
  });

  it('should show invalid credentials error when result.error is NOT related to email verification', async () => {
    (globalThis as any).__mockSignInEmail__.mockResolvedValue({
      error: { message: 'invalid password' }
    });
    render(<route.component />);
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeDefined();
      });
    }
  });

  it('should show generic error when signIn.email throws a generic error', async () => {
    (globalThis as any).__mockSignInEmail__.mockRejectedValue(new Error('Something went wrong'));
    render(<route.component />);
    if (mockOnSubmit) {
      await mockOnSubmit({ value: { email: 'test@example.com', password: TEST_PASSWORD } });
      await waitFor(() => {
        expect(screen.getByText('An error occurred. Please try again.')).toBeDefined();
      });
    }
  });
});
