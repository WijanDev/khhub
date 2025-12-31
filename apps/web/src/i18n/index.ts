import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import es from './locales/es.json';
import en from './locales/en.json';
import ca from './locales/ca.json';

export const languages = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'ca', name: 'Català' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

export const defaultLanguage: LanguageCode = 'es';

const resources = {
  es: { translation: es },
  en: { translation: en },
  ca: { translation: ca },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'khhub-language',
      // Normalize detected language codes to prevent hydration mismatches
      convertDetectedLanguage: (lng: string) => {
        // Extract base language code (before hyphen) to normalize 'es-ES' -> 'es'
        const baseLang = lng.split('-')[0];
        // Validate it's one of our supported languages, otherwise return default
        return languages.some((l) => l.code === baseLang) ? baseLang : defaultLanguage;
      },
    },
  });

export default i18n;

/**
 * Change the current language
 */
export function changeLanguage(lng: LanguageCode) {
  return i18n.changeLanguage(lng);
}

/**
 * Get the current language
 * Normalizes language codes (e.g., 'es-ES' -> 'es') to prevent hydration mismatches
 */
export function getCurrentLanguage(): LanguageCode {
  const lang = i18n.language || defaultLanguage;
  // Extract base language code (before hyphen) to normalize 'es-ES' -> 'es'
  const baseLang = lang.split('-')[0] as LanguageCode;
  // Validate it's one of our supported languages, otherwise fallback to default
  return languages.some((l) => l.code === baseLang) ? baseLang : defaultLanguage;
}

