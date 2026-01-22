import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n, { type LanguageCode } from '@/shared/infrastructure/i18n';

interface AppState {
    settings: {
        sidebarOpen: boolean;
        languageSwitcherOpen: boolean;
        language: LanguageCode;
    };
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    closeSidebar: () => void;
    setLanguage: (lang: LanguageCode) => void;
    toggleLanguageSwitcher: () => void;
    setLanguageSwitcherOpen: (open: boolean) => void;
    closeLanguageSwitcher: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            settings: {
                sidebarOpen: false,
                languageSwitcherOpen: false,
                language: (i18n.language?.split('-')[0] as LanguageCode) || 'es',
            },
            toggleSidebar: () => set((state) => ({ settings: { ...state.settings, sidebarOpen: !state.settings.sidebarOpen } })),
            setSidebarOpen: (open) => set((state) => ({ settings: { ...state.settings, sidebarOpen: open } })),
            closeSidebar: () => set((state) => ({ settings: { ...state.settings, sidebarOpen: false } })),
            setLanguage: (language) => {
                i18n.changeLanguage(language);
                set((state) => ({ settings: { ...state.settings, language } }))
            },
            toggleLanguageSwitcher: () => set((state) => ({ settings: { ...state.settings, languageSwitcherOpen: !state.settings.languageSwitcherOpen } })),
            setLanguageSwitcherOpen: (open) => set((state) => ({ settings: { ...state.settings, languageSwitcherOpen: open } })),
            closeLanguageSwitcher: () => set((state) => ({ settings: { ...state.settings, languageSwitcherOpen: false } })),
        }),
        {
            name: 'app-storage',
            partialize: (state) => ({ settings: state.settings }), // Only persist settings
        }
    )
);
