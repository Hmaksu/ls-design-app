import React from 'react';
import { LSContextType } from '../../types';
import { Info, Calendar, Clock, Globe, FileText, Target, Check } from 'lucide-react';
import { SDGS_LIST } from '../../constants';
import { useTranslation } from 'react-i18next';

export const Step1General: React.FC<{ context: LSContextType }> = ({ context }) => {
    const { t } = useTranslation();
    const { currentLS, updateLS } = context;
    const isLocked = !!currentLS.class_id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (isLocked) return;
        updateLS({ [e.target.name]: e.target.value });
    };

    const toggleSDG = (sdg: string) => {
        if (isLocked) return;
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

    const inputClass = `w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-itu-cyan outline-none transition-colors ${isLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 animate-fade-in space-y-8"
             data-chat-target="step-1-general" data-chat-name="Step 1: General Info">
            <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-itu-blue">{t('step1.title')}</h2>
                <p className="text-slate-500 mt-1">{t('step1.subtitle')}</p>
                {isLocked && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center text-amber-800 text-sm">
                        <Info className="w-5 h-5 mr-2 text-amber-500 flex-shrink-0" />
                        This is a Class Station. The Information Table is managed by your instructor and is locked for editing. You can only edit Modules (Step 3).
                    </div>
                )}
            </div>

            {/* 1. Identity Information */}
            <section>
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
                    <Info className="w-5 h-5 mr-2 text-itu-cyan" /> {t('step1.identity')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.lsTitle')}</label>
                        <input
                            type="text"
                            name="title"
                            value={currentLS.title}
                            onChange={handleChange}
                            placeholder={t('step1.exTitle')}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-title"
                            data-chat-name="Course Title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.code')}</label>
                        <input
                            type="text"
                            name="code"
                            value={currentLS.code}
                            onChange={handleChange}
                            placeholder={t('step1.exCode')}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-code"
                            data-chat-name="Course Code"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.ects')}</label>
                        <input
                            type="text"
                            name="ects"
                            value={currentLS.ects}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-ects"
                            data-chat-name="ECTS"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.startDate')}</label>
                        <input
                            type="date"
                            name="initialDesignDate"
                            value={currentLS.initialDesignDate}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-initialDesignDate"
                            data-chat-name="Start Date"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.revisionDate')}</label>
                        <input
                            type="date"
                            name="finalRevisionDate"
                            value={currentLS.finalRevisionDate}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-finalRevisionDate"
                            data-chat-name="Revision Date"
                        />
                    </div>
                </div>
            </section>

            <hr className="border-slate-100" />

            {/* 2. Content and Audience */}
            <section>
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
                    <FileText className="w-5 h-5 mr-2 text-itu-cyan" /> {t('step1.contentAudience')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.subject')}</label>
                        <input
                            type="text"
                            name="subject"
                            value={currentLS.subject}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-subject"
                            data-chat-name="Subject"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.level')}</label>
                        <select
                            name="level"
                            value={currentLS.level}
                            onChange={handleChange}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-level"
                            data-chat-name="Level"
                        >
                            <option value="Basic">{t('step1.levelBasic')}</option>
                            <option value="Intermediate">{t('step1.levelInter')}</option>
                            <option value="Advanced">{t('step1.levelAdv')}</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.keywords')}</label>
                        <input
                            type="text"
                            name="keywords"
                            value={currentLS.keywords}
                            onChange={handleChange}
                            placeholder={t('step1.keywordsPlace')}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-keywords"
                            data-chat-name="Keywords"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.targetAudience')}</label>
                        <textarea
                            name="targetAudience"
                            value={currentLS.targetAudience}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-targetAudience"
                            data-chat-name="Target Audience"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.shortDesc')}</label>
                        <textarea
                            name="description"
                            value={currentLS.description}
                            onChange={handleChange}
                            rows={3}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-description"
                            data-chat-name="Short Description"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.globalLos')}</label>
                        <p className="text-xs text-slate-400 mb-1">{t('step1.globalLosDesc')}</p>
                        <textarea
                            name="globalLearningOutcomes"
                            value={currentLS.globalLearningOutcomes}
                            onChange={handleChange}
                            rows={3}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-globalLos"
                            data-chat-name="Global Learning Outcomes"
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('step1.relatedSdgs')}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-slate-50"
                             data-chat-target="step-1-sdgs"
                             data-chat-name="Related SDGs">
                            {SDGS_LIST.map((sdg) => {
                                const isSelected = (currentLS.relatedSDGs || '').includes(sdg);
                                return (
                                    <button
                                        key={sdg}
                                        onClick={() => toggleSDG(sdg)}
                                        className={`flex items-start text-left text-xs p-2 rounded border transition-all ${isSelected
                                            ? 'bg-itu-blue text-white border-itu-blue shadow-sm'
                                            : isLocked ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-600 border-slate-200 hover:border-itu-cyan hover:bg-slate-50'
                                            }`}
                                        disabled={isLocked}
                                    >
                                        <div className={`mt-0.5 mr-2 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                        <span>{t(`sdgs.${sdg.split('.')[0]}` as any) || sdg}</span>
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
                    <Calendar className="w-5 h-5 mr-2 text-itu-cyan" /> {t('step1.assessmentLogistics')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.assessmentMethods')}</label>
                        <textarea
                            name="globalAssessmentMethods"
                            value={currentLS.globalAssessmentMethods}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            placeholder={t('step1.assessmentPlace')}
                            className={inputClass}
                            data-chat-target="step-1-globalAssessment"
                            data-chat-name="Global Assessment Methods"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.calendar')}</label>
                        <input
                            type="text"
                            name="calendar"
                            value={currentLS.calendar}
                            onChange={handleChange}
                            disabled={isLocked}
                            placeholder={t('step1.calPlace')}
                            className={inputClass}
                            data-chat-target="step-1-calendar"
                            data-chat-name="Calendar"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.durationIn')}</label>
                            <input
                                type="text"
                                name="durationInPerson"
                                value={currentLS.durationInPerson}
                                onChange={handleChange}
                                disabled={isLocked}
                                placeholder={t('step1.hours')}
                                className={inputClass}
                                data-chat-target="step-1-durationInPerson"
                                data-chat-name="Duration (In-Person)"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.durationDig')}</label>
                            <input
                                type="text"
                                name="durationDigital"
                                value={currentLS.durationDigital}
                                onChange={handleChange}
                                disabled={isLocked}
                                placeholder={t('step1.hours')}
                                className={inputClass}
                                data-chat-target="step-1-durationDigital"
                                data-chat-name="Duration (Digital)"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.quota')}</label>
                        <input
                            type="text"
                            name="quota"
                            value={currentLS.quota}
                            onChange={handleChange}
                            disabled={isLocked}
                            placeholder={t('step1.quotaPlace')}
                            className={inputClass}
                            data-chat-target="step-1-quota"
                            data-chat-name="Quota"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.language')}</label>
                        <select
                            name="language"
                            value={currentLS.language}
                            onChange={handleChange as any}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-language"
                            data-chat-name="Language"
                        >
                            <option value="">{t('step1.selectLanguage') || 'Select...'}</option>
                            <option value="Türkçe">Türkçe</option>
                            <option value="English">English</option>
                            <option value="Español">Español</option>
                            <option value="Français">Français</option>
                            <option value="Deutsch">Deutsch</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </section>

            <hr className="border-slate-100" />

            {/* 4. Requirements and Resources */}
            <section>
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4">
                    <Target className="w-5 h-5 mr-2 text-itu-cyan" /> {t('step1.reqResources')}
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.prereq')}</label>
                        <textarea
                            name="prerequisites"
                            value={currentLS.prerequisites}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-prerequisites"
                            data-chat-name="Prerequisites"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.specialNeeds')}</label>
                        <textarea
                            name="specialNeeds"
                            value={currentLS.specialNeeds}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-specialNeeds"
                            data-chat-name="Special Needs"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.materials')}</label>
                        <textarea
                            name="materialsAndResources"
                            value={currentLS.materialsAndResources}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-materialsAndResources"
                            data-chat-name="Materials and Resources"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.notes')}</label>
                        <textarea
                            name="notes"
                            value={currentLS.notes}
                            onChange={handleChange}
                            rows={2}
                            disabled={isLocked}
                            className={inputClass}
                            data-chat-target="step-1-notes"
                            data-chat-name="Notes"
                        />
                    </div>
                </div>
            </section>

        </div>
    );
};