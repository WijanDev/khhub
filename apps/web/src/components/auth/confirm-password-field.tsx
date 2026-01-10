import { AuthFormField } from './auth-form-field';
import React from 'react';

interface ConfirmPasswordFieldProps {
    readonly Field: any;
    readonly passwordFieldName: string;
    readonly label: string;
    readonly disabled?: boolean;
}

export function ConfirmPasswordField({
    Field,
    passwordFieldName,
    label,
    disabled,
}: ConfirmPasswordFieldProps) {
    return (
        <Field
            name="confirmPassword"
            validators={{
                onChange: ({ value, fieldApi }: any) => {
                    const password = fieldApi.form.getFieldValue(passwordFieldName);
                    if (value && password && value !== password) {
                        return 'validation.password.mismatch';
                    }
                    return undefined;
                },
            }}
        >
            {(field: any) => (
                <AuthFormField
                    field={field}
                    id="confirmPassword"
                    label={label}
                    type="password"
                    placeholder="••••••••"
                    disabled={disabled}
                />
            )}
        </Field>
    );
}
