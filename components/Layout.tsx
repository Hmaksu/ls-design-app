import React from 'react';
import { Layers, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <header className="bg-itu-blue text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Layers className="w-8 h-8 text-itu-cyan" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('header.title')}</h1>
              <p className="text-xs text-slate-300">{t('header.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher variant="header" />
            <div className="text-sm font-medium bg-itu-blue/50 px-3 py-1 rounded border border-itu-cyan/30">
              Pre-Alpha v2.4.1
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-white text-slate-500 py-6 mt-auto border-t border-slate-100">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-4">
          <a
            href="https://polen.itu.edu.tr/entities/publication/885d18fb-c6c0-4d0e-87d6-bd36b1781937"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-itu-blue text-white rounded-md hover:opacity-90 transition-opacity text-sm font-medium shadow-sm"
          >
            Learning Station Design Guide
          </a>
          <div className="text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Learning Station Design Tool.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};