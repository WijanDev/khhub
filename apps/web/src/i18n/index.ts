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
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.language as LanguageCode) || defaultLanguage;
}

