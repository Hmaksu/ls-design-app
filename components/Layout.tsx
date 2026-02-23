import React from 'react';
import { Layers } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      <header className="bg-itu-blue text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Layers className="w-8 h-8 text-itu-cyan" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Learning Station Designer</h1>
              <p className="text-xs text-slate-300">Based on ITU Learning Station Design Guide</p>
            </div>
          </div>
          <div className="text-sm font-medium bg-itu-blue/50 px-3 py-1 rounded border border-itu-cyan/30">
            Pre-Alpha v2.2.0
          </div>
        </div>
      </header>
      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-white text-slate-500 py-6 mt-auto border-t border-slate-100">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Learning Station Design Tool.</p>
        </div>
      </footer>
    </div>
  );
};