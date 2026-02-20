import React, { useState } from 'react';
import { LSContextType, BloomLevel, DeliveryModeType, LSModule, LSContent, LearningObjective } from '../../types';
import { DELIVERY_MODE_ICONS, DELIVERY_MODE_LABELS } from '../../constants';
import { Trash2, Plus, ChevronDown, ChevronUp, Link as LinkIcon, Box, FileText, CornerDownRight, PenLine } from 'lucide-react';

// --- Sub-component: Content Fields (Reusable for Content and SubContent) ---
const ContentFields: React.FC<{
  content: LSContent;
  onUpdate: (data: Partial<LSContent>) => void;
}> = ({ content, onUpdate }) => {
  const toggleDeliveryMode = (mode: DeliveryModeType) => {
    const modes = content.deliveryModes.includes(mode)
      ? content.deliveryModes.filter(m => m !== mode)
      : [...content.deliveryModes, mode];
    
    // Clean up links if mode is removed
    const newLinks = { ...content.deliveryLinks };
    if (!modes.includes(mode)) {
       delete newLinks[mode];
    }
    
    // Reset custom delivery mode text if OTHER is removed
    let customText = content.customDeliveryMode;
    if (mode === DeliveryModeType.OTHER && !modes.includes(mode)) {
      customText = undefined;
    }
    
    onUpdate({ deliveryModes: modes, deliveryLinks: newLinks, customDeliveryMode: customText });
  };

  const updateLink = (mode: string, url: string) => {
      onUpdate({ deliveryLinks: { ...content.deliveryLinks, [mode]: url }});
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Title & Duration */}
          <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
              <input 
                  type="text" 
                  value={content.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Content title..."
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded px-2 py-1.5 focus:border-itu-cyan outline-none"
              />
          </div>
          <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Min)</label>
              <input 
                  type="number" 
                  value={content.duration}
                  onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded px-2 py-1.5 focus:border-itu-cyan outline-none"
              />
          </div>

          {/* Delivery Modes & Links */}
          <div className="md:col-span-12">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Delivery Method & Links</label>
              <div className="flex flex-wrap gap-2">
                  {Object.values(DeliveryModeType).map(mode => {
                      const isSelected = content.deliveryModes.includes(mode);
                      const isOther = mode === DeliveryModeType.OTHER;
                      return (
                        <div key={mode} className={`relative group ${isSelected ? 'w-full sm:w-auto' : ''}`}>
                             <button
                                onClick={() => toggleDeliveryMode(mode)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded border text-xs transition-colors ${
                                    isSelected 
                                    ? 'bg-itu-blue text-white border-itu-blue' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:border-itu-cyan'
                                }`}
                             >
                                 {DELIVERY_MODE_ICONS[mode]}
                                 <span>{DELIVERY_MODE_LABELS[mode]}</span>
                             </button>
                             {/* Link/Text Input when Selected */}
                             {isSelected && (
                                 <div className="mt-2 space-y-2 animate-fade-in w-full sm:w-64">
                                     {isOther && (
                                        <div className="flex items-center">
                                          <PenLine className="w-3 h-3 text-slate-400 mr-1 flex-shrink-0" />
                                          <input
                                            type="text"
                                            value={content.customDeliveryMode || ''}
                                            onChange={(e) => onUpdate({ customDeliveryMode: e.target.value })}
                                            placeholder="Specify method..."
                                            className="text-xs bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 w-full placeholder:text-slate-400 focus:outline-none focus:border-itu-cyan"
                                          />
                                        </div>
                                     )}
                                     <div className="flex items-center">
                                        <LinkIcon className="w-3 h-3 text-slate-400 mr-1 flex-shrink-0" />
                                        <input 
                                            type="text"
                                            value={content.deliveryLinks[mode] || ''}
                                            onChange={(e) => updateLink(mode, e.target.value)}
                                            placeholder="URL..."
                                            className="text-xs bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 w-full placeholder:text-slate-400 focus:outline-none focus:border-itu-cyan"
                                        />
                                     </div>
                                 </div>
                             )}
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>
  );
};

// --- Sub-component: Content Card ---
const ContentCard: React.FC<{
  content: LSContent;
  onUpdate: (data: Partial<LSContent>) => void;
  onRemove: () => void;
  index: number;
}> = ({ content, onUpdate, onRemove, index }) => {
  
  const addSubContent = () => {
    const newSub: LSContent = {
      id: crypto.randomUUID(),
      title: '',
      duration: 5,
      deliveryModes: [],
      deliveryLinks: {}
    };
    onUpdate({ subContents: [...(content.subContents || []), newSub] });
  };

  const updateSubContent = (subId: string, data: Partial<LSContent>) => {
    const newSubs = (content.subContents || []).map(s => s.id === subId ? { ...s, ...data } : s);
    onUpdate({ subContents: newSubs });
  };

  const removeSubContent = (subId: string) => {
    const newSubs = (content.subContents || []).filter(s => s.id !== subId);
    onUpdate({ subContents: newSubs });
  };

  return (
    <div className="border border-slate-200 rounded bg-slate-50 p-4 mb-3 relative">
      <div className="absolute top-2 right-2">
         <button onClick={onRemove} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
      </div>
      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
         <Box className="w-3 h-3 mr-1" /> Content #{index + 1}
      </h4>
      
      <ContentFields content={content} onUpdate={onUpdate} />

      {/* Sub-Contents Area */}
      <div className="mt-4 pl-4 border-l-2 border-slate-200">
        <div className="mb-2 flex items-center justify-between">
           <span className="text-xs font-bold text-slate-400">SUB-CONTENTS (Optional)</span>
           <button onClick={addSubContent} className="text-xs flex items-center text-itu-cyan hover:text-itu-blue">
             <Plus className="w-3 h-3 mr-1"/> Add Sub-Content
           </button>
        </div>
        
        {(content.subContents || []).map((sub, sIdx) => (
           <div key={sub.id} className="bg-white border border-slate-200 rounded p-3 mb-2 relative">
              <div className="absolute top-2 right-2">
                <button onClick={() => removeSubContent(sub.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
              </div>
              <div className="flex items-center text-xs font-bold text-slate-400 mb-2">
                 <CornerDownRight className="w-3 h-3 mr-1" /> {index + 1}.{sIdx + 1}
              </div>
              <ContentFields content={sub} onUpdate={(data) => updateSubContent(sub.id, data)} />
           </div>
        ))}
      </div>

    </div>
  );
}

// --- Main Module Card ---
const ModuleCard: React.FC<{ 
  module: LSModule; 
  index: number; 
  onUpdate: (id: string, data: Partial<LSModule>) => void;
  onRemove: (id: string) => void;
  globalObjectives: LearningObjective[];
}> = ({ module, index, onUpdate, onRemove, globalObjectives }) => {
  const [expanded, setExpanded] = useState(true);

  // --- Content Handlers ---
  const addContent = () => {
      const newContent: LSContent = {
          id: crypto.randomUUID(),
          title: '',
          duration: 15,
          deliveryModes: [],
          deliveryLinks: {},
          subContents: []
      };
      onUpdate(module.id, { contents: [...module.contents, newContent] });
  };

  const updateContent = (contentId: string, data: Partial<LSContent>) => {
      const updatedContents = module.contents.map(c => c.id === contentId ? { ...c, ...data } : c);
      onUpdate(module.id, { contents: updatedContents });
  };

  const removeContent = (contentId: string) => {
      const updatedContents = module.contents.filter(c => c.id !== contentId);
      onUpdate(module.id, { contents: updatedContents });
  };

  // --- Objective Handlers ---
  const toggleObjective = (objId: string) => {
      const currentIds = module.associatedObjectiveIds || [];
      const newIds = currentIds.includes(objId) 
        ? currentIds.filter(id => id !== objId)
        : [...currentIds, objId];
      onUpdate(module.id, { associatedObjectiveIds: newIds });
  }

  const totalDuration = module.contents.reduce((acc, c) => {
    let subDuration = (c.subContents || []).reduce((sAcc, s) => sAcc + s.duration, 0);
    return acc + c.duration + subDuration;
  }, 0);

  return (
    <div className="border border-slate-200 rounded-lg mb-6 bg-white overflow-hidden transition-all shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between cursor-pointer border-b border-slate-100" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center justify-center bg-itu-blue/10 w-12 h-12 rounded-lg text-itu-blue">
              <span className="text-xs font-bold">MODULE</span>
              <span className="text-lg font-bold leading-none">{index + 1}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{module.title || 'Untitled Module'}</h3>
            <div className="flex items-center text-xs text-slate-500 space-x-3 mt-1">
                <span className="flex items-center"><Box className="w-3 h-3 mr-1"/> {module.contents.length} Content</span>
                <span className="flex items-center text-itu-gold font-medium"><div className="w-1.5 h-1.5 rounded-full bg-itu-gold mr-1"/> {totalDuration} min</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(module.id); }}
                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {/* Module Meta Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-slate-100 pb-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Module Title</label>
              <input
                type="text"
                value={module.title}
                onChange={(e) => onUpdate(module.id, { title: e.target.value })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
                placeholder="Enter module name"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bloom Level</label>
               <select
                 value={module.bloomLevel}
                 onChange={(e) => onUpdate(module.id, { bloomLevel: e.target.value as BloomLevel })}
                 className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm"
               >
                 {Object.values(BloomLevel).map(level => (
                   <option key={level} value={level}>{level}</option>
                 ))}
               </select>
            </div>

            {/* Module Outcome - Single */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Learning Outcome</label>
              <p className="text-xs text-slate-400 mb-1">What will the learner gain at the end of this module? (Enter a single outcome)</p>
              <textarea
                value={module.learningOutcome || ''}
                onChange={(e) => onUpdate(module.id, { learningOutcome: e.target.value })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
                rows={2}
                placeholder="Module learning outcome..."
              />
            </div>

            <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Related Global Objectives</label>
                 <div className="bg-slate-50 p-3 rounded border border-slate-200 max-h-40 overflow-y-auto">
                     {globalObjectives.length === 0 && <span className="text-xs text-slate-400">No objectives defined (Go to Step 2).</span>}
                     {globalObjectives.map((obj, i) => (
                         <label key={obj.id} className="flex items-start space-x-2 mb-2 last:mb-0 cursor-pointer hover:bg-slate-100 p-1 rounded">
                             <input 
                                type="checkbox" 
                                checked={(module.associatedObjectiveIds || []).includes(obj.id)}
                                onChange={() => toggleObjective(obj.id)}
                                className="mt-1 rounded text-itu-blue focus:ring-itu-cyan"
                             />
                             <span className="text-sm text-slate-700">{obj.text || `Objective ${i+1}`}</span>
                         </label>
                     ))}
                 </div>
            </div>

             <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assessment Method (Module Wide)</label>
               <input
                type="text"
                value={module.assessmentMethods.join(', ')}
                onChange={(e) => onUpdate(module.id, { assessmentMethods: e.target.value.split(', ') })}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded text-sm focus:border-itu-cyan outline-none"
                placeholder="Ex: Quiz, Project Submission"
              />
            </div>
          </div>
          
          {/* CONTENTS SECTION */}
          <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-itu-blue uppercase tracking-wide">Module Content</h4>
              <button 
                onClick={addContent}
                className="flex items-center text-xs bg-itu-blue text-white px-3 py-1.5 rounded hover:bg-blue-800 transition-colors"
              >
                  <Plus className="w-3 h-3 mr-1" /> Add Content
              </button>
          </div>
          
          <div className="space-y-3 bg-slate-100/50 p-4 rounded-lg border border-slate-200/60 min-h-[100px]">
              {module.contents.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                      No content added to this module yet.
                  </div>
              )}
              {module.contents.map((content, idx) => (
                  <ContentCard 
                    key={content.id} 
                    index={idx} 
                    content={content} 
                    onUpdate={(data) => updateContent(content.id, data)}
                    onRemove={() => removeContent(content.id)}
                  />
              ))}
          </div>

        </div>
      )}
    </div>
  );
};

export const Step3Modules: React.FC<{ context: LSContextType }> = ({ context }) => {
  const { currentLS, addModule, updateModule, removeModule } = context;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
           <h2 className="text-2xl font-bold text-itu-blue">3. Modules & Content</h2>
           <p className="text-slate-500 mt-1">Design the modules and content for the learning station.</p>
        </div>
        <button 
          onClick={addModule}
          className="flex items-center px-4 py-2 bg-itu-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md"
        >
           <Plus className="w-5 h-5 mr-2" />
           Add New Module
        </button>
      </div>

      <div className="space-y-6">
         {currentLS.modules.length === 0 && (
             <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
                 <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p>No modules added yet.</p>
                 <button onClick={addModule} className="text-itu-cyan font-bold hover:underline mt-2">Create first module</button>
             </div>
         )}

         {currentLS.modules.map((module, index) => (
             <ModuleCard 
                key={module.id} 
                index={index} 
                module={module} 
                onUpdate={updateModule}
                onRemove={removeModule}
                globalObjectives={currentLS.objectives}
             />
         ))}
      </div>
      
      {currentLS.modules.length > 0 && (
        <button
          onClick={addModule}
          className="mt-8 flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-itu-cyan hover:text-itu-cyan transition-all font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Module
        </button>
      )}
    </div>
  );
};