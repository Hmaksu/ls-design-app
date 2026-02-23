import React, { useState, useEffect, useRef } from 'react';
import { LearningStation, LSContextType, BloomLevel, LSModule } from './types';
import { Step1General } from './components/Steps/Step1General';
import { Step2Objectives } from './components/Steps/Step2Objectives';
import { Step3Modules } from './components/Steps/Step3Modules';
import { Step4Matrix } from './components/Steps/Step4Matrix';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { ChevronRight, ChevronLeft, Save, Upload, ArrowLeft, Download } from 'lucide-react';
import {
  isLoggedIn, getMe, logout as apiLogout,
  getStation, createStation, updateStation,
  AuthUser
} from './services/authService';

const createInitialLS = (): LearningStation => ({
  id: crypto.randomUUID(),
  code: '',
  initialDesignDate: new Date().toISOString().split('T')[0],
  finalRevisionDate: new Date().toISOString().split('T')[0],
  ects: '1',
  title: '',
  subject: '',
  keywords: '',
  level: 'Basic',
  targetAudience: '',
  description: '',
  objectives: [{ id: crypto.randomUUID(), text: '', isSmart: false }],
  globalLearningOutcomes: '',
  relatedSDGs: '',
  globalAssessmentMethods: '',
  calendar: '',
  durationInPerson: '0',
  durationDigital: '0',
  prerequisites: '',
  specialNeeds: '',
  materialsAndResources: '',
  quota: '',
  language: 'English',
  notes: '',
  modules: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

type AppView = 'auth' | 'dashboard' | 'editor';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<AppView>('auth');
  const [currentLS, setCurrentLS] = useState<LearningStation>(createInitialLS());
  const [editingId, setEditingId] = useState<string | null>(null); // null = new, string = existing
  const [role, setRole] = useState<'owner' | 'collaborator' | 'viewer'>('owner');
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const lastSavedDataRef = useRef<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoggedIn()) {
        try {
          const data = await getMe();
          setUser(data.user);
          setView('dashboard');
        } catch {
          // Token invalid, stay on auth
        }
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  // ═══ Browser History Navigation ═══
  const pushNav = (v: AppView, step: number) => {
    let hash = '#/';
    if (v === 'dashboard') hash = '#/dashboard';
    else if (v === 'editor') hash = `#/editor/step/${step}`;
    window.history.pushState({ view: v, step }, '', hash);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state) return;
      if (state.view === 'dashboard') {
        setView('dashboard');
        setCurrentStep(1);
      } else if (state.view === 'editor') {
        setView('editor');
        setCurrentStep(state.step || 1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ═══ Auth Handlers ═══
  const handleAuthSuccess = (u: AuthUser) => {
    setUser(u);
    setView('dashboard');
    window.history.replaceState({ view: 'dashboard', step: 1 }, '', '#/dashboard');
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    setView('auth');
    setCurrentLS(createInitialLS());
    setEditingId(null);
    window.history.replaceState({ view: 'auth', step: 1 }, '', '#/');
  };

  // ═══ Dashboard Handlers ═══
  const handleCreateNew = () => {
    const fresh = createInitialLS();
    setCurrentLS(fresh);
    setEditingId(null);
    setRole('owner');
    setCurrentStep(1);
    setView('editor');
    pushNav('editor', 1);
    lastSavedDataRef.current = JSON.stringify(fresh);
  };

  const handleOpenStation = async (id: string) => {
    try {
      const result = await getStation(id);
      setCurrentLS(result.station.data);
      setRole(result.role as any);
      setEditingId(id);
      setView('editor');
      if (result.role === 'viewer') {
        setCurrentStep(4);
        pushNav('editor', 4);
      } else {
        setCurrentStep(1);
        pushNav('editor', 1);
      }
      lastSavedDataRef.current = JSON.stringify(result.station.data);
    } catch (err) {
      alert('Failed to load station');
    }
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setCurrentStep(1);
    pushNav('dashboard', 1);
  };

  // ═══ LS Operations ═══
  const updateLS = (data: Partial<LearningStation>) => {
    setCurrentLS(prev => ({ ...prev, ...data, updatedAt: new Date().toISOString() }));
  };

  const addModule = () => {
    const newModule: LSModule = {
      id: crypto.randomUUID(),
      title: '',
      contents: [],
      associatedObjectiveIds: [],
      learningOutcome: '',
      bloomLevel: BloomLevel.UNDERSTANDING,
      assessmentMethods: [],
      description: ''
    };
    setCurrentLS(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
  };

  const updateModule = (id: string, data: Partial<LSModule>) => {
    setCurrentLS(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, ...data } : m)
    }));
  };

  const removeModule = (id: string) => {
    setCurrentLS(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== id)
    }));
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    setCurrentLS(prev => {
      const newModules = [...prev.modules];
      if (direction === 'up' && index > 0) {
        [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
      } else if (direction === 'down' && index < newModules.length - 1) {
        [newModules[index + 1], newModules[index]] = [newModules[index], newModules[index + 1]];
      }

      // Scroll to the moved module after state updates and re-renders
      setTimeout(() => {
        const targetId = newModules[direction === 'down' ? index + 1 : index - 1]?.id;
        if (targetId) {
          const el = document.getElementById(`module-${targetId}`);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 70; // 70px offset for nav
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }
      }, 100);

      return { ...prev, modules: newModules };
    });
  };

  const addObjective = () => {
    setCurrentLS(prev => ({
      ...prev,
      objectives: [...prev.objectives, { id: crypto.randomUUID(), text: '', isSmart: false }]
    }));
  };

  const updateObjective = (id: string, text: string) => {
    setCurrentLS(prev => ({
      ...prev,
      objectives: prev.objectives.map(o => o.id === id ? { ...o, text } : o)
    }));
  };

  const removeObjective = (id: string) => {
    setCurrentLS(prev => ({
      ...prev,
      objectives: prev.objectives.filter(o => o.id !== id)
    }));
  };

  const saveLS = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateStation(editingId, currentLS);
      } else {
        await createStation(currentLS);
        setEditingId(currentLS.id);
      }
      lastSavedDataRef.current = JSON.stringify(currentLS);
      alert('Station saved successfully!');
    } catch (err: any) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // ═══ Autosave ═══
  useEffect(() => {
    if (view !== 'editor') return;
    if (role === 'viewer') return;
    // Prevent autosaving a completely empty new station without a title
    if (!editingId && !currentLS.title.trim()) return;

    const currentString = JSON.stringify(currentLS);
    if (currentString === lastSavedDataRef.current) return;

    const timer = setTimeout(async () => {
      setAutoSaving(true);
      try {
        if (editingId) {
          await updateStation(editingId, currentLS);
        } else {
          await createStation(currentLS);
          setEditingId(currentLS.id);
        }
        lastSavedDataRef.current = currentString;
      } catch (err) {
        console.error('Autosave failed:', err);
      } finally {
        setAutoSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentLS, view, editingId]);

  const saveAsJSON = () => {
    const json = JSON.stringify(currentLS, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LS-${currentLS.code || 'Draft'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.id && Array.isArray(json.modules)) {
          // Assign a new ID to avoid conflicts
          const imported = { ...createInitialLS(), ...json, id: crypto.randomUUID() };
          setCurrentLS(imported);
          setEditingId(null); // treat as new
          setCurrentStep(1);
          setView('editor');
          pushNav('editor', 1);
          lastSavedDataRef.current = JSON.stringify(imported);
          alert("Project loaded successfully!");
        } else {
          alert("Error: Invalid or corrupt file format.");
        }
      } catch (error) {
        console.error(error);
        alert("Could not read file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const context: LSContextType = {
    currentLS,
    role,
    updateLS,
    addModule,
    updateModule,
    removeModule,
    moveModule,
    addObjective,
    updateObjective,
    removeObjective,
    saveLS
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1General context={context} />;
      case 2: return <Step2Objectives context={context} />;
      case 3: return <Step3Modules context={context} />;
      case 4: return <Step4Matrix context={context} />;
      default: return <Step1General context={context} />;
    }
  };

  // ═══ Auth Loading ═══
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // ═══ Auth View ═══
  if (view === 'auth') {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // ═══ Dashboard View ═══
  if (view === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        onCreateNew={handleCreateNew}
        onOpenStation={handleOpenStation}
        onLogout={handleLogout}
      />
    );
  }

  // ═══ Editor View ═══
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* Editor Header */}
      <header className="bg-itu-blue text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>My Stations</span>
            </button>
            <div className="w-px h-6 bg-white/20"></div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-base font-bold tracking-tight">
                  {currentLS.title || 'New Learning Station'}
                </h1>
                {autoSaving && (
                  <span className="text-xs flex items-center text-slate-300">
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mr-1"></div>
                    Saving...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {editingId ? 'Editing' : 'Creating new'} • {currentLS.code || 'No code'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <span className="text-xs text-slate-300 mr-2">{user.name}</span>
            )}
            <div className="text-sm font-medium bg-itu-blue/50 px-3 py-1 rounded border border-itu-cyan/30">
              Pre-Alpha v2.2.0
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Progress Bar & Actions */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                {/* Progress Steps */}
                <div className="flex space-x-4">
                  {[1, 2, 3, 4].map(step => (
                    <div
                      key={step}
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${role === 'viewer' && step !== 4 ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden' :
                        step === currentStep ? 'bg-itu-blue text-white cursor-pointer' :
                          step < currentStep ? 'bg-itu-cyan text-white cursor-pointer' : 'bg-slate-200 text-slate-500 cursor-pointer'
                        }`}
                      onClick={() => {
                        if (role === 'viewer' && step !== 4) return;
                        setCurrentStep(step);
                        pushNav('editor', step);
                      }}
                    >
                      {step}
                    </div>
                  ))}
                </div>

                {/* Top Actions: Import */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                  />
                  <button
                    onClick={handleImportClick}
                    className="flex items-center text-sm text-slate-500 hover:text-itu-blue px-3 py-1.5 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                  </button>
                </div>
              </div>

              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-itu-cyan transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                <span>Table 1 (Info)</span>
                <span>Objectives</span>
                <span>Modules & Content</span>
                <span>Matrix & Output</span>
              </div>
            </div>

            <div className="min-h-[500px]">
              {renderStep()}
            </div>

            <div className="flex justify-between mt-8 pb-12 print:hidden">
              <button
                onClick={() => { const s = Math.max(1, currentStep - 1); setCurrentStep(s); pushNav('editor', s); }}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-lg font-medium ${currentStep === 1 ? 'opacity-0' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </button>

              <div className="flex space-x-4">
                {currentStep === 4 && (
                  <>
                    <button
                      onClick={saveAsJSON}
                      className="flex items-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Save as JSON
                    </button>
                    {role !== 'viewer' && (
                      <button
                        onClick={saveLS}
                        disabled={saving}
                        className="flex items-center px-4 py-3 bg-itu-gold text-white rounded-lg hover:bg-yellow-600 shadow-sm disabled:opacity-50"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        {saving ? 'Saving...' : 'Save to Server'}
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => { const s = Math.min(4, currentStep + 1); setCurrentStep(s); pushNav('editor', s); }}
                  disabled={currentStep === 4}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${currentStep === 4 ? 'hidden' : 'bg-itu-blue text-white hover:bg-blue-900 shadow-lg'
                    }`}
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white text-slate-500 py-6 mt-auto border-t border-slate-100">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Learning Station Design Tool.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;