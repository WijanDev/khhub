import * as React from 'react';
import type { AnyFieldApi } from '@tanstack/react-form';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * TanStack Form + Shadcn UI integration components
 */

// Form context for sharing form state
const FormFieldContext = React.createContext<{
  name: string;
  error?: string;
  isBlurred: boolean;
} | null>(null);

function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within a FormField');
  }
  return context;
}

// Props for FormField component
interface FormFieldProps {
  field: AnyFieldApi;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField wrapper that provides context for child components
 */
function FormField({ field, children, className }: Readonly<FormFieldProps>) {
  let error: string | undefined;

  if (field.state.meta.isBlurred && field.state.meta.errors.length > 0) {
    const firstError = field.state.meta.errors[0];
    if (typeof firstError === 'string') {
      error = firstError;
    } else if (firstError && typeof firstError === 'object' && 'message' in firstError) {
      error = String((firstError as { message: unknown }).message);
    } else {
      error = String(firstError);
    }
  }

  const value = React.useMemo(
    () => ({
      name: field.name as string,
      error,
      isBlurred: field.state.meta.isBlurred,
    }),
    [field.name, error, field.state.meta.isBlurred]
  );

  return (
    <FormFieldContext.Provider value={value}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </FormFieldContext.Provider>
  );
}

/**
 * Form label with automatic error styling
 */
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

function FormLabel({ className, children, htmlFor, ...props }: Readonly<FormLabelProps>) {
  const { error, name } = useFormField();

  return (
    <Label
      htmlFor={htmlFor || name}
      className={cn(error && 'text-destructive', className)}
      {...props}
    >
      {children}
    </Label>
  );
}

/**
 * Form control wrapper - use this to wrap your input
 */
interface FormControlProps {
  children: React.ReactNode;
}

function FormControl({ children }: FormControlProps) {
  const { error } = useFormField();

  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        'aria-invalid': !!error,
      });
    }
    return child;
  });
}

/**
 * Form description text
 */
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

function FormDescription({ className, children, ...props }: Readonly<FormDescriptionProps>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

/**
 * Form error message - automatically shows field errors
 */
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

function FormMessage({ className, children, ...props }: Readonly<FormMessageProps>) {
  const { error } = useFormField();
  // Prefer children (translated) over error from context (untranslated)
  const message = children || error;

  if (!message) {
    return null;
  }

  return (
    <p className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {message}
    </p>
  );
}

/**
 * Form wrapper component
 */
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

function Form({ className, children, ...props }: Readonly<FormProps>) {
  return (
    <form className={cn('space-y-4', className)} {...props}>
      {children}
    </form>
  );
}

/**
 * Form item wrapper for consistent spacing
 */
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function FormItem({ className, children, ...props }: Readonly<FormItemProps>) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};

