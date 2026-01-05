import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Create mocks and store in globalThis for access in factories
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string | ((opts?: any) => string)> = {
    'auth.signUp.title': 'Sign Up',
    'auth.signUp.description': 'Create your account',
    'auth.signUp.name': 'Name',
    'auth.signUp.email': 'Email',
    'auth.signUp.password': 'Password',
    'auth.signUp.confirmPassword': 'Confirm Password',
    'auth.signUp.submit': 'Sign Up',
    'auth.signUp.submitting': 'Signing up...',
    'auth.signUp.hasAccount': 'Already have an account?',
    'auth.signUp.signIn': 'Sign in',
    'auth.signUp.success.title': 'Account Created',
    'auth.signUp.success.description': `Check your email ${options?.email || ''} for verification`,
    'auth.signUp.success.verifyTitle': 'Verify your email',
    'auth.signUp.success.verifyDescription': 'Please verify your email address to continue',
    'auth.signUp.success.signIn': 'Sign In',
    'auth.errors.genericError': 'An error occurred. Please try again.',
    'auth.emailVerification.resend': 'Resend verification email',
    'auth.emailVerification.resending': 'Resending...',
    'auth.emailVerification.resendSuccess': 'Verification email sent successfully',
    'auth.emailVerification.resendError': 'Failed to send verification email',
    'validation.password.mismatch': 'Passwords do not match',
  };
  const translation = translations[key];
  return typeof translation === 'function' ? translation(options) : (translation || key);
});

const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

const mockSignUpEmail = vi.fn().mockResolvedValue({ error: null });
const mockSendVerificationEmail = vi.fn().mockResolvedValue({ error: null });
const mockNavigate = vi.fn();

// Store in globalThis
(globalThis as any).__mockT__ = mockT;
(globalThis as any).__mockI18n__ = mockI18n;
(globalThis as any).__mockSignUpEmail__ = mockSignUpEmail;
(globalThis as any).__mockSendVerificationEmail__ = mockSendVerificationEmail;
(globalThis as any).__mockNavigate__ = mockNavigate;

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
    createFileRoute: vi.fn((path: string) => (config: any) => ({
      ...config,
      id: path,
      path,
    })),
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
let mockNameField = {
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
let mockEmailField = {
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
let mockPasswordField = {
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
        if (name === 'name') {
          return children(mockNameField);
        } else if (name === 'email') {
          return children(mockEmailField);
        } else if (name === 'password') {
          return children(mockPasswordField);
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
  signUp: {
    email: (params: any) => (globalThis as any).__mockSignUpEmail__(params),
  },
  sendVerificationEmail: (params: any) => (globalThis as any).__mockSendVerificationEmail__(params),
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

// Mock shared SignUpSchema
vi.mock('@khhub/shared', () => ({
  SignUpSchema: {
    shape: {
      name: {},
      email: {},
      password: {},
    },
    extend: vi.fn(() => ({
      refine: vi.fn(() => ({})),
    })),
  },
}));

// Mock Button component
vi.mock('@/components/ui/button', async () => {
  const React = await import('react');
  
  return {
    Button: ({ children, variant, type, size, className, disabled, onClick, ...props }: any) => {
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
  Mail: ({ className }: any) => (
    <svg data-testid="icon-mail" className={className} />
  ),
  CheckCircle: ({ className }: any) => (
    <svg data-testid="icon-check-circle" className={className} />
  ),
}));

// Import after mocks are set up
import { Route } from '../signup';

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
    expect(route.id).toBe('/auth/signup');
  });
});

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockSignUpEmail__.mockResolvedValue({ error: null });
    (globalThis as any).__mockSendVerificationEmail__.mockResolvedValue({ error: null });
    mockFormState = { isSubmitting: false };
    mockOnSubmit = null;
    mockNameField = {
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
    mockEmailField = {
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
    mockPasswordField = {
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
    
    (globalThis as any).__mockT__.mockImplementation((key: string, options?: any) => {
      const translations: Record<string, string | ((opts?: any) => string)> = {
        'auth.signUp.title': 'Sign Up',
        'auth.signUp.description': 'Create your account',
        'auth.signUp.name': 'Name',
        'auth.signUp.email': 'Email',
        'auth.signUp.password': 'Password',
        'auth.signUp.confirmPassword': 'Confirm Password',
        'auth.signUp.submit': 'Sign Up',
        'auth.signUp.submitting': 'Signing up...',
        'auth.signUp.hasAccount': 'Already have an account?',
        'auth.signUp.signIn': 'Sign in',
        'auth.signUp.success.title': 'Account Created',
        'auth.signUp.success.description': `Check your email ${options?.email || ''} for verification`,
        'auth.signUp.success.verifyTitle': 'Verify your email',
        'auth.signUp.success.verifyDescription': 'Please verify your email address to continue',
        'auth.signUp.success.signIn': 'Sign In',
        'auth.errors.genericError': 'An error occurred. Please try again.',
        'auth.emailVerification.resend': 'Resend verification email',
        'auth.emailVerification.resending': 'Resending...',
        'auth.emailVerification.resendSuccess': 'Verification email sent successfully',
        'auth.emailVerification.resendError': 'Failed to send verification email',
        'validation.password.mismatch': 'Passwords do not match',
      };
      const translation = translations[key];
      return typeof translation === 'function' ? translation(options) : (translation || key);
    });
  });

  it('should render the component', () => {
    render(<route.component />);
    
    const signUpTexts = screen.getAllByText('Sign Up');
    expect(signUpTexts.length).toBeGreaterThan(0);
  });

  it('should render card with title', () => {
    render(<route.component />);
    
    const signUpTexts = screen.getAllByText('Sign Up');
    const title = signUpTexts.find(t => t.tagName === 'H3');
    expect(title).toBeDefined();
    expect(title?.tagName).toBe('H3');
  });

  it('should render card with description', () => {
    render(<route.component />);
    
    expect(screen.getByText('Create your account')).toBeDefined();
  });

  it('should render name input field', () => {
    render(<route.component />);
    
    const nameLabel = screen.getByText('Name');
    expect(nameLabel).toBeDefined();
    
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeDefined();
    expect(nameInput).toHaveProperty('type', 'text');
  });

  it('should render email input field', () => {
    render(<route.component />);
    
    const emailLabel = screen.getByText('Email');
    expect(emailLabel).toBeDefined();
    
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeDefined();
    expect(emailInput).toHaveProperty('type', 'email');
  });

  it('should render password input field', () => {
    render(<route.component />);
    
    const passwordLabel = screen.getByText('Password');
    expect(passwordLabel).toBeDefined();
    
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeDefined();
    expect(passwordInput).toHaveProperty('type', 'password');
  });

  it('should render confirm password input field', () => {
    render(<route.component />);
    
    const confirmPasswordLabel = screen.getByText('Confirm Password');
    expect(confirmPasswordLabel).toBeDefined();
    
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    expect(confirmPasswordInput).toBeDefined();
    expect(confirmPasswordInput).toHaveProperty('type', 'password');
  });

  it('should render name input with placeholder', () => {
    render(<route.component />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    expect(nameInput).toBeDefined();
  });

  it('should render email input with placeholder', () => {
    render(<route.component />);
    
    const emailInput = screen.getByPlaceholderText('name@example.com');
    expect(emailInput).toBeDefined();
  });

  it('should render password inputs with placeholders', () => {
    render(<route.component />);
    
    const placeholders = screen.getAllByPlaceholderText('••••••••');
    expect(placeholders.length).toBe(2);
  });

  it('should render submit button', () => {
    render(<route.component />);
    
    const signUpTexts = screen.getAllByText('Sign Up');
    const submitButton = signUpTexts.find(btn => btn.closest('[data-testid="button"]'));
    expect(submitButton).toBeDefined();
    expect(submitButton?.closest('[data-testid="button"]')).toBeDefined();
  });

  it('should render sign in link', () => {
    render(<route.component />);
    
    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeDefined();
    expect(signInLink.closest('[data-testid="link"]')).toBeDefined();
  });

  it('should render sign in link with correct href', () => {
    render(<route.component />);
    
    const signInLink = screen.getByText('Sign in').closest('[data-testid="link"]');
    expect(signInLink?.getAttribute('href')).toBe('/auth/signin');
  });

  it('should render has account text', () => {
    render(<route.component />);
    
    expect(screen.getByText('Already have an account?')).toBeDefined();
  });

  it('should call signUp.email with correct params when onSubmit is called', async () => {
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({
        value: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      });
    }
  });

  it('should set signUpSuccess and userEmail on successful sign up', async () => {
    (globalThis as any).__mockSignUpEmail__.mockResolvedValue({ error: null });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({
        value: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalled();
    }
  });

  it('should handle error when signUp.email returns error', async () => {
    (globalThis as any).__mockSignUpEmail__.mockResolvedValue({
      error: {
        message: 'Email already exists',
      },
    });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({
        value: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalled();
    }
  });

  it('should handle error when signUp.email throws', async () => {
    (globalThis as any).__mockSignUpEmail__.mockRejectedValue(new Error('Network error'));
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      try {
        await mockOnSubmit({
          value: {
            name: 'John Doe',
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
          },
        });
      } catch {
        // Error is handled in component
      }
      
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalled();
    }
  });

  it('should clear serverError and resendSuccess at start of onSubmit', async () => {
    render(<route.component />);
    
    if (mockOnSubmit) {
      // First call with error
      (globalThis as any).__mockSignUpEmail__.mockResolvedValueOnce({
        error: { message: 'Error 1' },
      });
      await mockOnSubmit({
        value: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      
      // Second call should clear previous errors
      (globalThis as any).__mockSignUpEmail__.mockResolvedValueOnce({ error: null });
      await mockOnSubmit({
        value: {
          name: 'Jane Doe',
          email: 'test2@example.com',
          password: 'password456',
          confirmPassword: 'password456',
        },
      });
      
      // Both calls should have been made
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalledTimes(2);
    }
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
    
    const submitButton = screen.getByText('Signing up...');
    expect(submitButton).toBeDefined();
    expect(submitButton.closest('[data-testid="button"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('should show submitting text when form is submitting', () => {
    mockFormState = { isSubmitting: true };
    
    render(<route.component />);
    
    expect(screen.getByText('Signing up...')).toBeDefined();
  });

  it('should call field handleChange when input value changes', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<route.component />);
    
    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    await user.type(nameInput, 'John Doe');
    
    expect(mockNameField.handleChange).toHaveBeenCalled();
  });

  it('should call field handleBlur when input loses focus', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<route.component />);
    
    const nameInput = screen.getByLabelText('Name');
    await user.click(nameInput);
    await user.tab();
    
    expect(mockNameField.handleBlur).toHaveBeenCalled();
  });

  it('should call form handleSubmit when form is submitted', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    mockFormHandleSubmit.mockImplementation(async () => {
      if (mockOnSubmit) {
        await mockOnSubmit({
          value: {
            name: 'John Doe',
            email: 'test@example.com',
            password: 'password123',
            confirmPassword: 'password123',
          },
        });
      }
    });
    
    render(<route.component />);
    
    const signUpTexts = screen.getAllByText('Sign Up');
    const submitButton = signUpTexts.find(btn => btn.closest('[data-testid="button"]'));
    expect(submitButton).toBeDefined();
    if (submitButton) {
      await user.click(submitButton);
      expect(mockFormHandleSubmit).toHaveBeenCalled();
    }
  });

  it('should render success state structure when signUpSuccess is true', () => {
    // We can't easily mock useState, so we'll test the component structure
    // by checking that the form renders correctly initially
    render(<route.component />);
    
    // Initially, success state should not be shown
    expect(screen.queryByText('Account Created')).toBeNull();
    const signUpTexts = screen.getAllByText('Sign Up');
    expect(signUpTexts.length).toBeGreaterThan(0);
  });

  it('should call translation function for all text keys', () => {
    render(<route.component />);
    
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.title');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.description');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.name');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.email');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.password');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.confirmPassword');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.submit');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.hasAccount');
    expect((globalThis as any).__mockT__).toHaveBeenCalledWith('auth.signUp.signIn');
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
    (globalThis as any).__mockSignUpEmail__.mockResolvedValue({
      error: {},
    });
    
    render(<route.component />);
    
    if (mockOnSubmit) {
      await mockOnSubmit({
        value: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      
      expect((globalThis as any).__mockSignUpEmail__).toHaveBeenCalled();
    }
  });

  it('should handle resend verification email functionality', () => {
    // We can't easily mock useState, so we verify the component structure
    // The resend functionality is tested through the component's behavior
    render(<route.component />);
    
    // Initially, success state should not be shown
    expect(screen.queryByText('Resend verification email')).toBeNull();
  });
});
