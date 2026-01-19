import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type LanguageCode } from '@/shared/infrastructure/i18n';

interface AppState {
    sidebarOpen: boolean;
    settings: {
        language: LanguageCode;
    };
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    closeSidebar: () => void;
    setLanguage: (lang: LanguageCode) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            sidebarOpen: false,
            settings: {
                language: 'en', // Default
            },
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            closeSidebar: () => set({ sidebarOpen: false }),
            setLanguage: (language) =>
                set((state) => ({ settings: { ...state.settings, language } })),
        }),
        {
            name: 'app-storage',
            partialize: (state) => ({ settings: state.settings }), // Only persist settings
        }
    )
);
