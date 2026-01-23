import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '../../../../src/shared/infrastructure/ui/form';

// Mock TanStack Form field API
const createMockField = (overrides: Partial<any> = {}) => ({
  name: 'testField',
  state: {
    meta: {
      isBlurred: false,
      errors: [],
      ...overrides.state?.meta,
    },
    value: '',
    ...overrides.state,
  },
  ...overrides,
});

describe('Form', () => {
  it('should render a form element', () => {
    render(
      <Form>
        <div>Form content</div>
      </Form>
    );
    
    const form = screen.getByText('Form content').closest('form');
    expect(form).toBeDefined();
    expect(form?.tagName).toBe('FORM');
  });

  it('should accept custom className', () => {
    render(<Form className="custom-form">Content</Form>);
    
    const form = screen.getByText('Content').closest('form');
    expect(form?.className).toContain('custom-form');
  });

  it('should forward additional props', () => {
    render(<Form id="test-form" action="/submit">Content</Form>);
    
    const form = screen.getByText('Content').closest('form');
    expect(form?.getAttribute('id')).toBe('test-form');
    expect(form?.getAttribute('action')).toBe('/submit');
  });

  it('should handle form submission', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const user = userEvent.setup();
    
    render(
      <Form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </Form>
    );
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('FormItem', () => {
  it('should render a div wrapper', () => {
    const { container } = render(
      <FormItem>
        <div>Item content</div>
      </FormItem>
    );
    
    const item = container.firstChild as HTMLElement;
    expect(item).toBeDefined();
    expect(item.tagName).toBe('DIV');
  });

  it('should accept custom className', () => {
    const { container } = render(<FormItem className="custom-item">Content</FormItem>);
    
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain('custom-item');
  });

  it('should forward additional props', () => {
    const { container } = render(<FormItem id="item-id">Content</FormItem>);
    
    const item = container.firstChild as HTMLElement;
    expect(item.getAttribute('id')).toBe('item-id');
  });
});

describe('FormField', () => {
  it('should provide form field context', () => {
    const mockField = createMockField();
    
    const TestComponent = () => {
      const field = useFormField();
      return <div data-testid="field-info">{field.name}</div>;
    };
    
    render(
      <FormField field={mockField}>
        <TestComponent />
      </FormField>
    );
    
    expect(screen.getByTestId('field-info').textContent).toBe('testField');
  });

  it('should extract error from field state when blurred', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Field is required'],
        },
      },
    });
    
    const TestComponent = () => {
      const field = useFormField();
      return <div data-testid="field-error">{field.error}</div>;
    };
    
    render(
      <FormField field={mockField}>
        <TestComponent />
      </FormField>
    );
    
    expect(screen.getByTestId('field-error').textContent).toBe('Field is required');
  });

  it('should not show error when not blurred', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: false,
          errors: ['Field is required'],
        },
      },
    });
    
    const TestComponent = () => {
      const field = useFormField();
      return <div data-testid="field-error">{field.error || 'no error'}</div>;
    };
    
    render(
      <FormField field={mockField}>
        <TestComponent />
      </FormField>
    );
    
    expect(screen.getByTestId('field-error').textContent).toBe('no error');
  });

  it('should handle error object with message property', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: [{ message: 'Custom error message' }],
        },
      },
    });
    
    const TestComponent = () => {
      const field = useFormField();
      return <div data-testid="field-error">{field.error}</div>;
    };
    
    render(
      <FormField field={mockField}>
        <TestComponent />
      </FormField>
    );
    
    expect(screen.getByTestId('field-error').textContent).toBe('Custom error message');
  });

  it('should handle non-string errors', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: [123],
        },
      },
    });
    
    const TestComponent = () => {
      const field = useFormField();
      return <div data-testid="field-error">{field.error}</div>;
    };
    
    render(
      <FormField field={mockField}>
        <TestComponent />
      </FormField>
    );
    
    expect(screen.getByTestId('field-error').textContent).toBe('123');
  });

  it('should accept custom className', () => {
    const mockField = createMockField();
    
    render(
      <FormField field={mockField} className="custom-field">
        <div>Content</div>
      </FormField>
    );
    
    const wrapper = screen.getByText('Content').parentElement;
    expect(wrapper?.className).toContain('custom-field');
  });
});

describe('FormLabel', () => {
  it('should throw error when used outside FormField', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<FormLabel>Label</FormLabel>);
    }).toThrow('useFormField must be used within a FormField');
    
    consoleSpy.mockRestore();
  });

  it('should render label with field name as htmlFor', () => {
    const mockField = createMockField({ name: 'email' });
    
    render(
      <FormField field={mockField}>
        <FormLabel>Email</FormLabel>
      </FormField>
    );
    
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label.getAttribute('for')).toBe('email');
  });

  it('should use custom htmlFor when provided', () => {
    const mockField = createMockField({ name: 'email' });
    
    render(
      <FormField field={mockField}>
        <FormLabel htmlFor="custom-id">Email</FormLabel>
      </FormField>
    );
    
    const label = screen.getByText('Email');
    expect(label.getAttribute('for')).toBe('custom-id');
  });

  it('should apply error styling when field has error', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Error message'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormLabel>Email</FormLabel>
      </FormField>
    );
    
    const label = screen.getByText('Email');
    expect(label.className).toContain('text-destructive');
  });

  it('should accept custom className', () => {
    const mockField = createMockField();
    
    render(
      <FormField field={mockField}>
        <FormLabel className="custom-label">Label</FormLabel>
      </FormField>
    );
    
    const label = screen.getByText('Label');
    expect(label.className).toContain('custom-label');
  });
});

describe('FormControl', () => {
  it('should throw error when used outside FormField', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <FormControl>
          <input />
        </FormControl>
      );
    }).toThrow('useFormField must be used within a FormField');
    
    consoleSpy.mockRestore();
  });

  it('should add aria-invalid when field has error', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Error message'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormControl>
          <input data-testid="test-input" />
        </FormControl>
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('should not add aria-invalid when field has no error', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: [],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormControl>
          <input data-testid="test-input" />
        </FormControl>
      </FormField>
    );
    
    const input = screen.getByTestId('test-input');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('should wrap multiple children', () => {
    const mockField = createMockField();
    
    render(
      <FormField field={mockField}>
        <FormControl>
          <input data-testid="input1" />
          <input data-testid="input2" />
        </FormControl>
      </FormField>
    );
    
    expect(screen.getByTestId('input1')).toBeDefined();
    expect(screen.getByTestId('input2')).toBeDefined();
  });

  it('should handle non-React element children', () => {
    const mockField = createMockField();
    
    render(
      <FormField field={mockField}>
        <FormControl>
          <input data-testid="input" />
          Text node
        </FormControl>
      </FormField>
    );
    
    expect(screen.getByTestId('input')).toBeDefined();
  });
});

describe('FormDescription', () => {
  it('should render description text', () => {
    render(<FormDescription>This is a description</FormDescription>);
    
    const description = screen.getByText('This is a description');
    expect(description).toBeDefined();
    expect(description.tagName).toBe('P');
  });

  it('should accept custom className', () => {
    render(<FormDescription className="custom-desc">Description</FormDescription>);
    
    const description = screen.getByText('Description');
    expect(description.className).toContain('custom-desc');
  });

  it('should forward additional props', () => {
    render(<FormDescription id="desc-id">Description</FormDescription>);
    
    const description = screen.getByText('Description');
    expect(description.getAttribute('id')).toBe('desc-id');
  });
});

describe('FormMessage', () => {
  it('should throw error when used outside FormField', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<FormMessage />);
    }).toThrow('useFormField must be used within a FormField');
    
    consoleSpy.mockRestore();
  });

  it('should render error from context when no children provided', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Field is required'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormMessage />
      </FormField>
    );
    
    const message = screen.getByText('Field is required');
    expect(message).toBeDefined();
    expect(message.tagName).toBe('P');
  });

  it('should render children when provided', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Field is required'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormMessage>Custom error message</FormMessage>
      </FormField>
    );
    
    const message = screen.getByText('Custom error message');
    expect(message).toBeDefined();
    // Should not show the context error when children are provided
    expect(screen.queryByText('Field is required')).toBeNull();
  });

  it('should return null when no error and no children', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: [],
        },
      },
    });
    
    const { container } = render(
      <FormField field={mockField}>
        <FormMessage />
      </FormField>
    );
    
    // FormMessage should return null, so no paragraph should be rendered
    const messages = container.querySelectorAll('p');
    expect(Array.from(messages).filter(p => p.textContent === '')).toHaveLength(0);
  });

  it('should accept custom className', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Error'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormMessage className="custom-message" />
      </FormField>
    );
    
    const message = screen.getByText('Error');
    expect(message.className).toContain('custom-message');
  });

  it('should forward additional props', () => {
    const mockField = createMockField({
      state: {
        meta: {
          isBlurred: true,
          errors: ['Error'],
        },
      },
    });
    
    render(
      <FormField field={mockField}>
        <FormMessage id="message-id" />
      </FormField>
    );
    
    const message = screen.getByText('Error');
    expect(message.getAttribute('id')).toBe('message-id');
  });
});

describe('useFormField hook', () => {
  it('should throw error when used outside FormField', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponent = () => {
      useFormField();
      return null;
    };
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useFormField must be used within a FormField');
    
    consoleSpy.mockRestore();
  });
});

describe('Form composition', () => {
  it('should render complete form structure', () => {
    const mockField = createMockField({ name: 'email' });
    
    render(
      <Form>
        <FormItem>
          <FormField field={mockField}>
            <FormLabel>Email</FormLabel>
            <FormDescription>Enter your email address</FormDescription>
            <FormControl>
              <input type="email" data-testid="email-input" />
            </FormControl>
            <FormMessage />
          </FormField>
        </FormItem>
      </Form>
    );
    
    expect(screen.getByText('Email')).toBeDefined();
    expect(screen.getByText('Enter your email address')).toBeDefined();
    expect(screen.getByTestId('email-input')).toBeDefined();
  });

  it('should show error message in complete form', () => {
    const mockField = createMockField({
      name: 'email',
      state: {
        meta: {
          isBlurred: true,
          errors: ['Email is required'],
        },
      },
    });
    
    render(
      <Form>
        <FormItem>
          <FormField field={mockField}>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <input type="email" data-testid="email-input" />
            </FormControl>
            <FormMessage />
          </FormField>
        </FormItem>
      </Form>
    );
    
    expect(screen.getByText('Email is required')).toBeDefined();
    expect(screen.getByTestId('email-input').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Email').className).toContain('text-destructive');
  });
});
