import React from 'react';
import { LSContextType } from '../../types';
import { Info, Calendar, Clock, Globe, FileText, Target, Check } from 'lucide-react';
import { SDGS_LIST } from '../../constants';

export const Step1General: React.FC<{ context: LSContextType }> = ({ context }) => {
  const { currentLS, updateLS } = context;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateLS({ [e.target.name]: e.target.value });
  };

  const toggleSDG = (sdg: string) => {
    const currentSDGs = currentLS.relatedSDGs ? currentLS.relatedSDGs.split(', ') : [];
    let newSDGs = [];
    if (currentSDGs.includes(sdg)) {
      newSDGs = currentSDGs.filter(s => s !== sdg);
    } else {
      newSDGs = [...currentSDGs, sdg].filter(Boolean);
    }
    // Sort based on the index in SDGS_LIST to keep order
    newSDGs.sort((a, b) => SDGS_LIST.indexOf(a) - SDGS_LIST.indexOf(b));
    updateLS({ relatedSDGs: newSDGs.join(', ') });
  };

  const inputClass = "w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-itu-cyan outline-none transition-colors";

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in space-y-8">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-itu-blue">1. LS Information Table</h2>
        <p className="text-slate-500 mt-1">Fill in the basic information included in the Toolkit 1 catalog.</p>
      </div>
      
      {/* 1. Identity Information */}
      <section>
        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
           <Info className="w-5 h-5 mr-2 text-itu-cyan" /> Identity Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">LS Title</label>
            <input
                type="text"
                name="title"
                value={currentLS.title}
                onChange={handleChange}
                placeholder="Ex: Sustainable Architectural Design"
                className={inputClass}
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input
                type="text"
                name="code"
                value={currentLS.code}
                onChange={handleChange}
                placeholder="Ex: ARCH-101"
                className={inputClass}
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Microcredential (ECTS)</label>
            <input
                type="text"
                name="ects"
                value={currentLS.ects}
                onChange={handleChange}
                className={inputClass}
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
                type="date"
                name="initialDesignDate"
                value={currentLS.initialDesignDate}
                onChange={handleChange}
                className={inputClass}
            />
            </div>
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Revision Date</label>
            <input
                type="date"
                name="finalRevisionDate"
                value={currentLS.finalRevisionDate}
                onChange={handleChange}
                className={inputClass}
            />
            </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* 2. Content and Audience */}
      <section>
        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
           <FileText className="w-5 h-5 mr-2 text-itu-cyan" /> Content & Target Audience
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                    type="text"
                    name="subject"
                    value={currentLS.subject}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <select
                    name="level"
                    value={currentLS.level}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
                <input
                    type="text"
                    name="keywords"
                    value={currentLS.keywords}
                    onChange={handleChange}
                    placeholder="Separate with commas..."
                    className={inputClass}
                />
            </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                <textarea
                    name="targetAudience"
                    value={currentLS.targetAudience}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                <textarea
                    name="description"
                    value={currentLS.description}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Global Learning Outcomes (LOs)</label>
                <p className="text-xs text-slate-400 mb-1">Skills and competencies to be gained at the end of this LS.</p>
                <textarea
                    name="globalLearningOutcomes"
                    value={currentLS.globalLearningOutcomes}
                    onChange={handleChange}
                    rows={3}
                    className={inputClass}
                />
            </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Related SDGs</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-slate-50">
                  {SDGS_LIST.map((sdg) => {
                    const isSelected = (currentLS.relatedSDGs || '').includes(sdg);
                    return (
                      <button
                        key={sdg}
                        onClick={() => toggleSDG(sdg)}
                        className={`flex items-start text-left text-xs p-2 rounded border transition-all ${
                          isSelected 
                            ? 'bg-itu-blue text-white border-itu-blue shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-itu-cyan hover:bg-slate-50'
                        }`}
                      >
                         <div className={`mt-0.5 mr-2 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                         </div>
                         <span>{sdg}</span>
                      </button>
                    )
                  })}
                </div>
            </div>
        </div>
      </section>

       <hr className="border-slate-100" />

       {/* 3. Assessment and Logistics */}
       <section>
        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
           <Calendar className="w-5 h-5 mr-2 text-itu-cyan" /> Assessment & Logistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Methods</label>
                <textarea
                    name="globalAssessmentMethods"
                    value={currentLS.globalAssessmentMethods}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Assessment approaches to be used across the LS"
                    className={inputClass}
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Calendar</label>
                 <input
                    type="text"
                    name="calendar"
                    value={currentLS.calendar}
                    onChange={handleChange}
                    placeholder="Implementation schedule"
                    className={inputClass}
                />
            </div>
             <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (In-person)</label>
                    <input
                        type="text"
                        name="durationInPerson"
                        value={currentLS.durationInPerson}
                        onChange={handleChange}
                        placeholder="Hours"
                        className={inputClass}
                    />
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Digital)</label>
                    <input
                        type="text"
                        name="durationDigital"
                        value={currentLS.durationDigital}
                        onChange={handleChange}
                        placeholder="Hours"
                        className={inputClass}
                    />
                 </div>
            </div>
             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Quota</label>
                 <input
                    type="text"
                    name="quota"
                    value={currentLS.quota}
                    onChange={handleChange}
                    placeholder="Min - Max"
                    className={inputClass}
                />
            </div>
             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
                 <input
                    type="text"
                    name="language"
                    value={currentLS.language}
                    onChange={handleChange}
                    className={inputClass}
                />
            </div>
        </div>
       </section>

       <hr className="border-slate-100" />

       {/* 4. Requirements and Resources */}
       <section>
        <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
           <Target className="w-5 h-5 mr-2 text-itu-cyan" /> Requirements & Resources
        </h3>
        <div className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prerequisites</label>
                <textarea
                    name="prerequisites"
                    value={currentLS.prerequisites}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Needs</label>
                <textarea
                    name="specialNeeds"
                    value={currentLS.specialNeeds}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Materials and Resources</label>
                <textarea
                    name="materialsAndResources"
                    value={currentLS.materialsAndResources}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                    name="notes"
                    value={currentLS.notes}
                    onChange={handleChange}
                    rows={2}
                    className={inputClass}
                />
            </div>
        </div>
       </section>

    </div>
  );
};