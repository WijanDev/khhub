import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/infrastructure/ui/button';
import { useAppStore } from '@/shared/application/stores/app-store';
import { languages, changeLanguage, type LanguageCode } from '@/shared/infrastructure/i18n';
import { Check } from 'lucide-react';
import 'flag-icons/css/flag-icons.min.css';

// Map language codes to country codes for flags
const languageToCountry: Record<LanguageCode, string> = {
  es: 'es', // Spain
  en: 'gb', // United Kingdom
  ca: 'es-ct', // Catalonia (uses es-ct for the Catalan flag)
};

function Flag({ code, className = '' }: Readonly<{ code: LanguageCode; className?: string }>) {
  const countryCode = languageToCountry[code];
  return (
    <span
      className={`fi fi-${countryCode} rounded-sm ${className}`}
      style={{ width: '1.25rem', height: '0.9rem', display: 'inline-block' }}
    />
  );
}

export function LanguageSwitcher({ variant = 'default' }: Readonly<{ variant?: 'default' | 'compact' }>) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { setLanguage } = useAppStore();
  const currentLanguage = (i18n.language?.split('-')[0] as LanguageCode) || 'es';

  const handleChange = async (code: LanguageCode) => {
    await changeLanguage(code);
    setLanguage(code);
    setIsOpen(false);
  };

  const currentLang = languages.find((l) => l.code === currentLanguage) || languages[0];

  if (variant === 'compact') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8 p-0"
        >
          <Flag code={currentLang.code} />
        </Button>

        {isOpen && (
          <>
            <div
              aria-hidden="true"
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-md">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleChange(lang.code)}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Flag code={lang.code} />
                  <span className="flex-1 text-left">{lang.name}</span>
                  {currentLanguage === lang.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Flag code={currentLang.code} />
        <span>{currentLang.name}</span>
      </Button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Flag code={lang.code} />
                <span className="flex-1 text-left">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
