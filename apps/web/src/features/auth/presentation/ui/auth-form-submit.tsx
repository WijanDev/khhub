import { Button } from '@/shared/infrastructure/ui/button';
import { useTranslation } from 'react-i18next';

interface AuthFormSubmitProps {
    readonly isSubmitting: boolean;
    readonly labelKey: string;
    readonly submittingLabelKey: string;
    readonly className?: string;
}

export function AuthFormSubmit({
    isSubmitting,
    labelKey,
    submittingLabelKey,
    className = 'w-full',
}: AuthFormSubmitProps) {
    const { t } = useTranslation();

    return (
        <Button type="submit" className={className} disabled={isSubmitting}>
            {isSubmitting ? t(submittingLabelKey) : t(labelKey)}
        </Button>
    );
}
