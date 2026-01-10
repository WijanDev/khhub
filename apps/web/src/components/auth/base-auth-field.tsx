import { AuthFormField } from './auth-form-field';
import React from 'react';

interface BaseAuthFieldProps {
    readonly Field: any;
    readonly name: string;
    readonly label: string;
    readonly type?: string;
    readonly placeholder?: string;
    readonly validator?: any;
    readonly disabled?: boolean;
    readonly rightElement?: React.ReactNode;
}

export function BaseAuthField({
    Field,
    name,
    label,
    type = 'text',
    placeholder,
    validator,
    disabled,
    rightElement,
}: BaseAuthFieldProps) {
    return (
        <Field name={name} validators={{ onChange: validator }}>
            {(field: any) => (
                <AuthFormField
                    field={field}
                    id={name}
                    label={label}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    rightElement={rightElement}
                />
            )}
        </Field>
    );
}
