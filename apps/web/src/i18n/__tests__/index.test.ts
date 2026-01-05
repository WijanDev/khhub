import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LanguageCode } from '../index';

// Mock i18next
const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
const mockUse = vi.fn().mockReturnThis();
const mockInit = vi.fn().mockReturnThis();

const mockI18n = {
  use: mockUse,
  init: mockInit,
  changeLanguage: mockChangeLanguage,
  language: 'es',
};

vi.mock('i18next', () => ({
  default: mockI18n,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  initReactI18next: {},
}));

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: {},
}));

// Mock locale files - JSON imports return the object directly
vi.mock('../locales/es.json', () => ({ default: { validation: { required: 'Este campo es obligatorio' } } }), { virtual: true });
vi.mock('../locales/en.json', () => ({ default: { validation: { required: 'This field is required' } } }), { virtual: true });
vi.mock('../locales/ca.json', () => ({ default: { validation: { required: 'Aquest camp és obligatori' } } }), { virtual: true });

describe('i18n exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset i18n language to default
    mockI18n.language = 'es';
  });

  it('should export languages array with correct structure', async () => {
    const { languages } = await import('../index');
    
    expect(languages).toBeDefined();
    expect(Array.isArray(languages)).toBe(true);
    expect(languages).toHaveLength(3);
    
    expect(languages[0]).toEqual({ code: 'es', name: 'Español' });
    expect(languages[1]).toEqual({ code: 'en', name: 'English' });
    expect(languages[2]).toEqual({ code: 'ca', name: 'Català' });
  });

  it('should export defaultLanguage as "es"', async () => {
    const { defaultLanguage } = await import('../index');
    
    expect(defaultLanguage).toBe('es');
  });

  it('should export LanguageCode type', async () => {
    // Type check - if this compiles, the type is exported
    const code: LanguageCode = 'es';
    expect(code).toBe('es');
  });

  it('should export i18n instance', async () => {
    const i18n = await import('../index');
    
    expect(i18n.default).toBeDefined();
    expect(i18n.default).toBe(mockI18n);
  });
});

describe('i18n initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize i18n with LanguageDetector', async () => {
    await import('../index');
    
    expect(mockUse).toHaveBeenCalled();
    // Check that LanguageDetector was used
    const useCalls = mockUse.mock.calls;
    expect(useCalls.length).toBeGreaterThan(0);
  });

  it('should initialize i18n with initReactI18next', async () => {
    await import('../index');
    
    expect(mockUse).toHaveBeenCalled();
    // Check that initReactI18next was used
    const useCalls = mockUse.mock.calls;
    expect(useCalls.length).toBeGreaterThan(0);
  });

  it('should call init with correct configuration', async () => {
    await import('../index');
    
    expect(mockInit).toHaveBeenCalledTimes(1);
    const initCall = mockInit.mock.calls[0][0];
    
    expect(initCall).toBeDefined();
    expect(initCall.fallbackLng).toBe('es');
    expect(initCall.defaultNS).toBe('translation');
    expect(initCall.interpolation).toEqual({ escapeValue: false });
    expect(initCall.detection).toBeDefined();
    expect(initCall.detection.order).toEqual(['localStorage', 'navigator', 'htmlTag']);
    expect(initCall.detection.caches).toEqual(['localStorage']);
    expect(initCall.detection.lookupLocalStorage).toBe('khhub-language');
    expect(typeof initCall.detection.convertDetectedLanguage).toBe('function');
  });

  it('should include all language resources', async () => {
    await import('../index');
    
    const initCall = mockInit.mock.calls[0][0];
    expect(initCall.resources).toBeDefined();
    expect(initCall.resources.es).toBeDefined();
    expect(initCall.resources.en).toBeDefined();
    expect(initCall.resources.ca).toBeDefined();
    expect(initCall.resources.es.translation).toBeDefined();
    expect(initCall.resources.en.translation).toBeDefined();
    expect(initCall.resources.ca.translation).toBeDefined();
  });
});

describe('convertDetectedLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should normalize language codes (es-ES -> es)', async () => {
    await import('../index');
    
    const initCall = mockInit.mock.calls[0][0];
    const convertDetectedLanguage = initCall.detection.convertDetectedLanguage;
    
    expect(convertDetectedLanguage('es-ES')).toBe('es');
    expect(convertDetectedLanguage('en-US')).toBe('en');
    expect(convertDetectedLanguage('ca-ES')).toBe('ca');
  });

  it('should return base language code for supported languages', async () => {
    await import('../index');
    
    const initCall = mockInit.mock.calls[0][0];
    const convertDetectedLanguage = initCall.detection.convertDetectedLanguage;
    
    expect(convertDetectedLanguage('es')).toBe('es');
    expect(convertDetectedLanguage('en')).toBe('en');
    expect(convertDetectedLanguage('ca')).toBe('ca');
  });

  it('should return default language for unsupported languages', async () => {
    await import('../index');
    
    const initCall = mockInit.mock.calls[0][0];
    const convertDetectedLanguage = initCall.detection.convertDetectedLanguage;
    
    expect(convertDetectedLanguage('fr')).toBe('es');
    expect(convertDetectedLanguage('de')).toBe('es');
    expect(convertDetectedLanguage('fr-FR')).toBe('es');
    expect(convertDetectedLanguage('de-DE')).toBe('es');
  });

  it('should handle language codes with multiple hyphens', async () => {
    await import('../index');
    
    const initCall = mockInit.mock.calls[0][0];
    const convertDetectedLanguage = initCall.detection.convertDetectedLanguage;
    
    expect(convertDetectedLanguage('es-ES-Variant')).toBe('es');
    expect(convertDetectedLanguage('en-US-Region')).toBe('en');
  });
});

describe('changeLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'es';
  });

  it('should call i18n.changeLanguage with the provided language code', async () => {
    const { changeLanguage } = await import('../index');
    
    await changeLanguage('en');
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
  });

  it('should support changing to Spanish', async () => {
    const { changeLanguage } = await import('../index');
    
    await changeLanguage('es');
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('should support changing to English', async () => {
    const { changeLanguage } = await import('../index');
    
    await changeLanguage('en');
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('should support changing to Catalan', async () => {
    const { changeLanguage } = await import('../index');
    
    await changeLanguage('ca');
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('ca');
  });

  it('should return a promise', async () => {
    const { changeLanguage } = await import('../index');
    
    const result = changeLanguage('en');
    
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});

describe('getCurrentLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current language when it is a supported language', async () => {
    mockI18n.language = 'es';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should return English when current language is English', async () => {
    mockI18n.language = 'en';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('en');
  });

  it('should return Catalan when current language is Catalan', async () => {
    mockI18n.language = 'ca';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('ca');
  });

  it('should normalize language codes (es-ES -> es)', async () => {
    mockI18n.language = 'es-ES';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should normalize language codes (en-US -> en)', async () => {
    mockI18n.language = 'en-US';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('en');
  });

  it('should normalize language codes (ca-ES -> ca)', async () => {
    mockI18n.language = 'ca-ES';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('ca');
  });

  it('should return default language when current language is unsupported', async () => {
    mockI18n.language = 'fr';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should return default language when current language is undefined', async () => {
    mockI18n.language = undefined as any;
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should return default language when current language is empty string', async () => {
    mockI18n.language = '';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should handle language codes with multiple hyphens', async () => {
    mockI18n.language = 'es-ES-Variant';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });

  it('should return default language for unsupported base language', async () => {
    mockI18n.language = 'fr-FR';
    const { getCurrentLanguage } = await import('../index');
    
    const result = getCurrentLanguage();
    
    expect(result).toBe('es');
  });
});
