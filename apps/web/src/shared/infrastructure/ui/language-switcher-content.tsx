import { Flag } from "./flag";
import { type LanguageCode, languages } from "../i18n";
import { Check } from "lucide-react";
import { useAppStore } from "@/shared/application/stores/app-store";

export function LanguageSwitcherContent() {
    const { closeLanguageSwitcher, setLanguage, settings } = useAppStore();
    const handleChange = (code: LanguageCode) => {
        setLanguage(code);
        closeLanguageSwitcher();
    };


    if (settings.languageSwitcherOpen) {
        return (
            <>
                <div
                    aria-hidden="true"
                    className="fixed inset-0 z-40"
                    onClick={() => closeLanguageSwitcher()}
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
                            {settings.language === lang.code && (
                                <Check className="h-4 w-4 text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </>
        )
    }
}
