import type { AnyFieldApi } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getFieldError, hasFieldError } from '@/lib/form-utils';
import React from 'react';

interface AuthFormFieldProps {
    readonly field: AnyFieldApi;
    readonly label: string;
    readonly type?: string;
    readonly placeholder?: string;
    readonly id: string;
    readonly disabled?: boolean;
    readonly rightElement?: React.ReactNode;
}

export function AuthFormField({
    field,
    label,
    type = 'text',
    placeholder,
    id,
    disabled,
    rightElement,
}: AuthFormFieldProps) {
    const { t } = useTranslation();

    return (
        <FormField field={field}>
            <div className="flex items-center justify-between">
                <FormLabel htmlFor={id}>{label}</FormLabel>
                {rightElement}
            </div>
            <FormControl>
                <Input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={disabled}
                />
            </FormControl>
            {hasFieldError(field.state.meta.isBlurred, field.state.meta.errors) && (
                <FormMessage>{getFieldError(field.state.meta.errors, t)}</FormMessage>
            )}
        </FormField>
    );
}
