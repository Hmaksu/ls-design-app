import React, { useState } from 'react';
import { LSContextType } from '../../types';
import { Trash2, Plus, Sparkles, Loader2, Info } from 'lucide-react';
import { generateObjectivesWithAI } from '../../services/geminiService';
import { useTranslation } from 'react-i18next';

export const Step2Objectives: React.FC<{ context: LSContextType }> = ({ context }) => {
  const { t, i18n } = useTranslation();
  const { currentLS, addObjective, updateObjective, removeObjective } = context;
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const isLocked = !!currentLS.class_id;

  const handleAI = async () => {
    if (isLocked) return;
    if (!currentLS.subject) {
      alert(t('step2.aiError'));
      return;
    }
    setLoadingAI(true);
    const suggestions = await generateObjectivesWithAI(currentLS.subject, currentLS.level, i18n.language);

    // Auto-fill empty objectives or add new ones
    suggestions.forEach((text, index) => {
      // If we have an empty slot, use it, otherwise add new
      if (currentLS.objectives[index] && currentLS.objectives[index].text === '') {
        updateObjective(currentLS.objectives[index].id, text);
      } else {
        // Context needs refactor for adding with text, skipping auto-add to state for now to keep it simple
        // User can copy paste from UI
      }
    });

    setAiSuggestions(suggestions);
    setLoadingAI(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-2xl font-bold text-itu-blue">{t('step2.title')}</h2>
      </div>

      <p className="text-slate-500 mb-6 text-sm">
        {t('step2.subtitle')}
      </p>

      {isLocked && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center text-amber-800 text-sm">
          <Info className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0" />
          This is a Class Station. Learning Objectives are managed by your instructor and are locked for editing.
        </div>
      )}

      <div className="space-y-4">
        {currentLS.objectives.map((obj, index) => (
          <div key={obj.id} className="flex items-start space-x-3">
            <span className="mt-3 text-sm font-bold text-slate-400 w-6">#{index + 1}</span>
            <div className="flex-grow">
              <textarea
                value={obj.text}
                onChange={(e) => updateObjective(obj.id, e.target.value)}
                placeholder={t('step2.placeholder')}
                disabled={isLocked}
                className={`w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-itu-cyan focus:border-transparent outline-none text-sm ${isLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                rows={2}
              />
            </div>
            {!isLocked && (
              <button
                onClick={() => removeObjective(obj.id)}
                className="mt-2 text-red-400 hover:text-red-600 transition-colors p-2"
                title={t('step2.deleteObj')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isLocked && (
        <button
          onClick={addObjective}
          className="mt-6 flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-itu-cyan hover:text-itu-cyan transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('step2.addObj')}
        </button>
      )}
    </div>
  );
};