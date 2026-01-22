import { type LanguageCode } from "../i18n";


// Map language codes to country codes for flags
const languageToCountry: Record<LanguageCode, string> = {
    es: 'es', // Spain
    en: 'gb', // United Kingdom
    ca: 'es-ct', // Catalonia (uses es-ct for the Catalan flag)
};

export function Flag({ code, className = '' }: Readonly<{ code: LanguageCode; className?: string }>) {
    const countryCode = languageToCountry[code];
    return (
        <span
            className={`fi fi-${countryCode} rounded-sm ${className}`}
            style={{ width: '1.25rem', height: '0.9rem', display: 'inline-block' }}
        />
    );
}