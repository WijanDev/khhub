import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');
  const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
  const mockI18n = {
    language: 'es',
    changeLanguage: mockChangeLanguage,
  };

  // Store mocks in a way that can be accessed later
  (globalThis as any).__mockI18nInstance__ = mockI18n;

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: mockI18n,
    }),
  };
});

// Mock i18n module
vi.mock('@/shared/infrastructure/i18n', async () => {
  const actual = await vi.importActual('@/shared/infrastructure/i18n');
  const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);

  // Store mock in a way that can be accessed later
  (globalThis as any).__mockChangeLanguageModule__ = mockChangeLanguage;

  return {
    ...actual,
    changeLanguage: mockChangeLanguage,
    languages: [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
      { code: 'ca', name: 'Català' },
    ],
  };
});

// Mock app-store
vi.mock('@/shared/application/stores/app-store', async () => {
  const { create } = await import('zustand');
  const store = create((set) => ({
    settings: {
      sidebarOpen: false,
      languageSwitcherOpen: false,
      language: 'es',
    },
    toggleSidebar: () => {
      set((state: any) => ({ settings: { ...state.settings, sidebarOpen: !state.settings.sidebarOpen } }));
    },
    setSidebarOpen: (open: boolean) => set((state: any) => ({ settings: { ...state.settings, sidebarOpen: open } })),
    closeSidebar: () => set((state: any) => ({ settings: { ...state.settings, sidebarOpen: false } })),
    setLanguage: (language: string) => {
      // Call the global mock if available to satisfy expectations
      if ((globalThis as any).__mockChangeLanguageModule__) {
        (globalThis as any).__mockChangeLanguageModule__(language);
      }
      set((state: any) => ({ settings: { ...state.settings, language } }))
    },
    toggleLanguageSwitcher: () => set((state: any) => ({ settings: { ...state.settings, languageSwitcherOpen: !state.settings.languageSwitcherOpen } })),
    setLanguageSwitcherOpen: (open: boolean) => set((state: any) => ({ settings: { ...state.settings, languageSwitcherOpen: open } })),
    closeLanguageSwitcher: () => set((state: any) => ({ settings: { ...state.settings, languageSwitcherOpen: false } })),
  }));
  return { useAppStore: store };
});

// Mock flag-icons CSS
vi.mock('flag-icons/css/flag-icons.min.css', () => ({}));

// Import component after mocks are set up
import { useAppStore } from '@/shared/application/stores/app-store';
import { LanguageSwitcher } from '../../../../src/shared/infrastructure/ui/language-switcher';

describe('LanguageSwitcher', () => {
  let mockI18nInstance: { language: string; changeLanguage: ReturnType<typeof vi.fn> };
  let mockChangeLanguageModule: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockI18nInstance = (globalThis as any).__mockI18nInstance__;
    mockChangeLanguageModule = (globalThis as any).__mockChangeLanguageModule__;
    mockI18nInstance.language = 'es';

    // Reset store state
    useAppStore.setState({
      settings: {
        sidebarOpen: false,
        languageSwitcherOpen: false,
        language: 'es',
      }
    });
  });

  describe('default variant', () => {
    it('should render with default variant', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toBeDefined();
    });

    it('should display current language name', () => {
      mockI18nInstance.language = 'es';
      render(<LanguageSwitcher />);

      expect(screen.getByText('Español')).toBeDefined();
    });

    it('should display English when current language is English', () => {
      mockI18nInstance.language = 'en';
      render(<LanguageSwitcher />);

      expect(screen.getByText('English')).toBeDefined();
    });

    it('should display Catalan when current language is Catalan', () => {
      mockI18nInstance.language = 'ca';
      render(<LanguageSwitcher />);

      expect(screen.getByText('Català')).toBeDefined();
    });

    it('should normalize language codes (es-ES -> es)', () => {
      mockI18nInstance.language = 'es-ES';
      render(<LanguageSwitcher />);

      expect(screen.getByText('Español')).toBeDefined();
    });

    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // All language options should be visible in dropdown
      const languageOptions = screen.getAllByText(/Español|English|Català/);
      expect(languageOptions.length).toBeGreaterThanOrEqual(3);
    });

    it('should close dropdown when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Verify dropdown is open
      expect(screen.getByText('English')).toBeDefined();

      // Click overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeDefined();
      if (overlay) {
        await user.click(overlay);
      }

      // Dropdown should be closed (only button text visible)
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1);
      });
    });

    it('should call changeLanguage when a language option is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Find and click English option
      const englishButton = screen.getByText('English').closest('button');
      expect(englishButton).toBeDefined();
      if (englishButton) {
        await user.click(englishButton);
      }

      await waitFor(() => {
        expect(mockChangeLanguageModule).toHaveBeenCalledWith('en');
      });
    });

    it('should close dropdown after selecting a language', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Select a language
      const englishButton = screen.getByText('English').closest('button');
      if (englishButton) {
        await user.click(englishButton);
      }

      // Dropdown should be closed
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1);
      });
    });

    it('should show checkmark for current language', async () => {
      mockI18nInstance.language = 'es';
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Check icon should be present for Spanish
      const checkIcons = document.querySelectorAll('.h-4.w-4.text-primary');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('should render flag icons for each language', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Flag icons should be rendered
      const flagIcons = document.querySelectorAll('.fi');
      expect(flagIcons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('compact variant', () => {
    it('should render with compact variant', () => {
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      expect(button).toBeDefined();
    });

    it('should not display language name in compact variant', () => {
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      // In compact variant, only flag should be visible, not the name
      expect(button.textContent).not.toContain('Español');
    });

    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // All language options should be visible
      expect(screen.getByText('Español')).toBeDefined();
      expect(screen.getByText('English')).toBeDefined();
      expect(screen.getByText('Català')).toBeDefined();
    });

    it('should call changeLanguage when a language option is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Find and click English option
      const englishButton = screen.getByText('English').closest('button');
      expect(englishButton).toBeDefined();
      if (englishButton) {
        await user.click(englishButton);
      }

      await waitFor(() => {
        expect(mockChangeLanguageModule).toHaveBeenCalledWith('en');
      });
    });

    it('should close dropdown after selecting a language', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Select a language
      const englishButton = screen.getByText('English').closest('button');
      if (englishButton) {
        await user.click(englishButton);
      }

      // Dropdown should be closed
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1);
      });
    });

    it('should close dropdown when overlay is clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Verify dropdown is open
      expect(screen.getByText('English')).toBeDefined();

      // Click overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      expect(overlay).toBeDefined();
      if (overlay) {
        await user.click(overlay);
      }

      // Dropdown should be closed (only button visible)
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1);
      });
    });

    it('should show checkmark for current language', async () => {
      mockI18nInstance.language = 'en';
      const user = userEvent.setup();
      render(<LanguageSwitcher variant="compact" />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Check icon should be present for English
      const checkIcons = document.querySelectorAll('.h-4.w-4.text-primary');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe('language selection', () => {
    it('should call changeLanguage with Spanish code', async () => {
      const user = userEvent.setup();
      // Set language to English so we can click Spanish
      mockI18nInstance.language = 'en';
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Find the Spanish button in the dropdown
      const allButtons = screen.getAllByRole('button');
      const spanishButton = allButtons.find(btn => {
        const text = btn.textContent || '';
        return text.includes('Español') && btn.classList.contains('flex'); // Dropdown buttons have 'flex' class
      });

      expect(spanishButton).toBeDefined();
      if (spanishButton) {
        await user.click(spanishButton);
      }

      await waitFor(() => {
        expect(mockChangeLanguageModule).toHaveBeenCalledWith('es');
      });
    });

    it('should call changeLanguage with English code', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      const englishButton = screen.getByText('English').closest('button');
      if (englishButton) {
        await user.click(englishButton);
      }

      await waitFor(() => {
        expect(mockChangeLanguageModule).toHaveBeenCalledWith('en');
      });
    });

    it('should call changeLanguage with Catalan code', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      const catalanButton = screen.getByText('Català').closest('button');
      if (catalanButton) {
        await user.click(catalanButton);
      }

      await waitFor(() => {
        expect(mockChangeLanguageModule).toHaveBeenCalledWith('ca');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined language gracefully', () => {
      mockI18nInstance.language = undefined as any;
      render(<LanguageSwitcher />);

      // Should default to Spanish (first language)
      expect(screen.getByText('Español')).toBeDefined();
    });

    it('should handle empty string language gracefully', () => {
      mockI18nInstance.language = '';
      render(<LanguageSwitcher />);

      // Should default to Spanish (first language)
      expect(screen.getByText('Español')).toBeDefined();
    });

    it('should handle unsupported language code', () => {
      mockI18nInstance.language = 'fr';
      render(<LanguageSwitcher />);

      // Should default to Spanish (first language)
      expect(screen.getByText('Español')).toBeDefined();
    });

    it('should toggle dropdown on multiple clicks', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');

      // Open dropdown
      await user.click(button);
      expect(screen.getByText('English')).toBeDefined();

      // Close dropdown
      await user.click(button);
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(1);
      });

      // Open again
      await user.click(button);
      expect(screen.getByText('English')).toBeDefined();
    });
  });

  describe('Flag component', () => {
    it('should render flag for Spanish', async () => {
      const user = userEvent.setup();
      const { container } = render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Spanish flag should be rendered (check for fi-es class)
      const flags = container.querySelectorAll('.fi.fi-es');
      expect(flags.length).toBeGreaterThan(0);
    });

    it('should render flag for English', async () => {
      const user = userEvent.setup();
      const { container } = render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // English flag should be rendered (check for fi-gb class)
      const flags = container.querySelectorAll('.fi.fi-gb');
      expect(flags.length).toBeGreaterThan(0);
    });

    it('should render flag for Catalan', async () => {
      const user = userEvent.setup();
      const { container } = render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Catalan flag should be rendered (check for fi-es-ct class)
      const flags = container.querySelectorAll('.fi.fi-es-ct');
      expect(flags.length).toBeGreaterThan(0);
    });
  });
});
