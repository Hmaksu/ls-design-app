import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
];

interface LanguageSwitcherProps {
    variant?: 'header' | 'dashboard';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };

    const currentLang = i18n.language ? i18n.language.slice(0, 2).toLowerCase() : 'tr';
    const currentLangLabel = currentLang.toUpperCase();

    // Styling based on where the switcher is placed
    const buttonClass = variant === 'header'
        ? "flex items-center space-x-1 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors border border-slate-600"
        : "flex items-center space-x-1 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200";

    const dropdownClass = variant === 'header'
        ? "absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded shadow-lg overflow-hidden z-[9999] py-1"
        : "absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-[9999] py-1";

    const itemClass = variant === 'header'
        ? "block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        : "block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors";

    const activeItemClass = variant === 'header'
        ? "bg-slate-700 text-white font-medium"
        : "bg-blue-50 text-blue-700 font-medium";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClass}
                title="Change Language"
            >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">{currentLangLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-70 ml-1" />
            </button>

            {isOpen && (
                <div className={dropdownClass}>
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`${itemClass} ${currentLang === lang.code ? activeItemClass : ''}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
