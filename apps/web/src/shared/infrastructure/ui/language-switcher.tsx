import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/infrastructure/ui/button';
import { useAppStore } from '@/shared/application/stores/app-store';
import { languages, type LanguageCode } from '@/shared/infrastructure/i18n';
import 'flag-icons/css/flag-icons.min.css';
import { Flag } from './flag';
import { LanguageSwitcherContent } from './language-switcher-content';





export function LanguageSwitcher({ variant = 'default' }: Readonly<{ variant?: 'default' | 'compact' }>) {
  const { toggleLanguageSwitcher } = useAppStore();
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.language?.split('-')[0] as LanguageCode) || 'es';


  const currentLang = languages.find((l) => l.code === currentLanguage) || languages[0];

  if (variant === 'compact') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleLanguageSwitcher()}
          className="h-8 w-8 p-0"
        >
          <Flag code={currentLang.code} />
        </Button>
        <LanguageSwitcherContent />
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleLanguageSwitcher()}
        className="gap-2"
      >
        <Flag code={currentLang.code} />
        <span>{currentLang.name}</span>
      </Button>
      <LanguageSwitcherContent />
    </div>
  );
}
