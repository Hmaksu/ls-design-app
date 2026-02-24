import React from 'react';
import { LSContextType } from '../../types';
import { Info, Calendar, Clock, Globe, FileText, Target, Check } from 'lucide-react';
import { SDGS_LIST } from '../../constants';
import { useTranslation } from 'react-i18next';

export const Step1General: React.FC<{ context: LSContextType }> = ({ context }) => {
    const { t } = useTranslation();
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
                <h2 className="text-2xl font-bold text-itu-blue">{t('step1.title')}</h2>
                <p className="text-slate-500 mt-1">{t('step1.subtitle')}</p>
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
                            className={inputClass}
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
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.ects')}</label>
                        <input
                            type="text"
                            name="ects"
                            value={currentLS.ects}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.startDate')}</label>
                        <input
                            type="date"
                            name="initialDesignDate"
                            value={currentLS.initialDesignDate}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.revisionDate')}</label>
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
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.level')}</label>
                        <select
                            name="level"
                            value={currentLS.level}
                            onChange={handleChange}
                            className={inputClass}
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
                            className={inputClass}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.targetAudience')}</label>
                        <textarea
                            name="targetAudience"
                            value={currentLS.targetAudience}
                            onChange={handleChange}
                            rows={2}
                            className={inputClass}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.shortDesc')}</label>
                        <textarea
                            name="description"
                            value={currentLS.description}
                            onChange={handleChange}
                            rows={3}
                            className={inputClass}
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
                            className={inputClass}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('step1.relatedSdgs')}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-slate-50">
                            {SDGS_LIST.map((sdg) => {
                                const isSelected = (currentLS.relatedSDGs || '').includes(sdg);
                                return (
                                    <button
                                        key={sdg}
                                        onClick={() => toggleSDG(sdg)}
                                        className={`flex items-start text-left text-xs p-2 rounded border transition-all ${isSelected
                                            ? 'bg-itu-blue text-white border-itu-blue shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-itu-cyan hover:bg-slate-50'
                                            }`}
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
                            placeholder={t('step1.assessmentPlace')}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.calendar')}</label>
                        <input
                            type="text"
                            name="calendar"
                            value={currentLS.calendar}
                            onChange={handleChange}
                            placeholder={t('step1.calPlace')}
                            className={inputClass}
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
                                placeholder={t('step1.hours')}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.durationDig')}</label>
                            <input
                                type="text"
                                name="durationDigital"
                                value={currentLS.durationDigital}
                                onChange={handleChange}
                                placeholder={t('step1.hours')}
                                className={inputClass}
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
                            placeholder={t('step1.quotaPlace')}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.language')}</label>
                        <select
                            name="language"
                            value={currentLS.language}
                            onChange={handleChange as any}
                            className={inputClass}
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
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.specialNeeds')}</label>
                        <textarea
                            name="specialNeeds"
                            value={currentLS.specialNeeds}
                            onChange={handleChange}
                            rows={2}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.materials')}</label>
                        <textarea
                            name="materialsAndResources"
                            value={currentLS.materialsAndResources}
                            onChange={handleChange}
                            rows={2}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('step1.notes')}</label>
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