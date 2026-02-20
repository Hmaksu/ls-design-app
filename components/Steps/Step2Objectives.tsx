import React, { useState } from 'react';
import { LSContextType } from '../../types';
import { Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { generateObjectivesWithAI } from '../../services/geminiService';

export const Step2Objectives: React.FC<{ context: LSContextType }> = ({ context }) => {
  const { currentLS, addObjective, updateObjective, removeObjective } = context;
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const handleAI = async () => {
    if (!currentLS.subject) {
      alert("Please specify a 'Subject' in step 1 first.");
      return;
    }
    setLoadingAI(true);
    const suggestions = await generateObjectivesWithAI(currentLS.subject, currentLS.level);
    
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
        <h2 className="text-2xl font-bold text-itu-blue">2. Learning Objectives</h2>
        <button 
          onClick={handleAI}
          disabled={loadingAI}
          className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
        >
          {loadingAI ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
          <span>Suggest SMART Objectives with AI</span>
        </button>
      </div>

      <p className="text-slate-500 mb-6 text-sm">
        Ensure your objectives are written within the SMART (Specific, Measurable, Achievable, Relevant, Time-bound) framework.
      </p>

      {aiSuggestions.length > 0 && (
        <div className="mb-6 bg-purple-50 p-4 rounded-md border border-purple-100">
          <h3 className="text-sm font-bold text-purple-800 mb-2">AI Suggestions:</h3>
          <ul className="space-y-2">
            {aiSuggestions.map((sugg, idx) => (
              <li key={idx} className="flex items-start justify-between text-sm text-purple-700 bg-white p-2 rounded border border-purple-100 shadow-sm">
                <span>{sugg}</span>
                <button 
                   onClick={() => {
                     const emptyObj = currentLS.objectives.find(o => !o.text);
                     if(emptyObj) updateObjective(emptyObj.id, sugg);
                     else {
                        navigator.clipboard.writeText(sugg);
                        alert("Copied! You can paste it into a new objective.");
                     }
                   }}
                   className="text-xs bg-purple-200 px-2 py-1 rounded hover:bg-purple-300 ml-2 whitespace-nowrap"
                >
                  Copy
                </button>
              </li>
            ))}
          </ul>
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
                placeholder="What will learners achieve at the end of this station?"
                className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-itu-cyan focus:border-transparent outline-none text-sm"
                rows={2}
              />
            </div>
            <button
              onClick={() => removeObjective(obj.id)}
              className="mt-2 text-red-400 hover:text-red-600 transition-colors p-2"
              title="Delete Objective"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addObjective}
        className="mt-6 flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-itu-cyan hover:text-itu-cyan transition-all"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Objective
      </button>
    </div>
  );
};