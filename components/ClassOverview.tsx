import React, { useState, useEffect } from 'react';
import {
    ChevronDown, ChevronRight, Loader2, X, User, Box, Clock,
    BookOpen, ArrowLeft, FolderOpen, ExternalLink, ChevronUp,
    GraduationCap, Layers, FoldVertical, UnfoldVertical, Filter, Settings2, Check
} from 'lucide-react';
import { getClassOverview } from '../services/authService';
import { DELIVERY_MODE_ICONS, DELIVERY_MODE_LABELS } from '../constants';
import { useTranslation } from 'react-i18next';
import { StationChat } from './StationChat';
import { MessageCircle } from 'lucide-react';

interface ClassOverviewProps {
    classId: string;
    className: string;
    user: { id: number; name: string; email: string; role?: string };
    onClose: () => void;
    onOpenStation: (stationId: string) => void;
}

interface StudentOverview {
    student_id: number;
    student_name: string;
    student_email: string;
    station_id: string | null;
    updated_at: string | null;
    modules: any[];
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({ classId, className, user, onClose, onOpenStation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<StudentOverview[]>([]);
    const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({});
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
    const [studentFilters, setStudentFilters] = useState<number[]>([]);
    const [moduleFilters, setModuleFilters] = useState<number[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

    useEffect(() => {
        loadOverview();
    }, [classId]);

    const loadOverview = async () => {
        setLoading(true);
        try {
            const data = await getClassOverview(classId);
            setStudents(data.students);
            // Auto-expand all students
            const expanded: Record<number, boolean> = {};
            data.students.forEach((s: StudentOverview) => { expanded[s.student_id] = true; });
            setExpandedStudents(expanded);
        } catch (err: any) {
            alert(err.message || t('classOverview.failedToLoadOverview'));
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (id: number) => {
        setExpandedStudents(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleModule = (key: string) => {
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const allStudentsExpanded = students.length > 0 && students.every(s => expandedStudents[s.student_id]);

    const toggleAllStudents = () => {
        const next = !allStudentsExpanded;
        const newState: Record<number, boolean> = {};
        students.forEach(s => { newState[s.student_id] = next; });
        setExpandedStudents(newState);
    };

    const toggleStudentFilter = (id: number) => {
        setStudentFilters(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const toggleModuleFilter = (idx: number) => {
        setModuleFilters(prev =>
            prev.includes(idx) ? prev.filter(fidx => fidx !== idx) : [...prev, idx]
        );
    };

    const clearFilters = () => {
        setStudentFilters([]);
        setModuleFilters([]);
    };

    const selectAllStudents = () => setStudentFilters(students.map(s => s.student_id));

    // Modules calculation
    const maxModules = Math.max(0, ...students.map(s => s.modules?.length || 0));
    const selectAllModules = () => setModuleFilters(Array.from({ length: maxModules }).map((_, i) => i));

    const totalModuleCount = (s: StudentOverview) => s.modules?.length || 0;

    const getDeliveryModesSummary = (mod: any) => {
        const allModes = new Set<string>();
        (mod.contents || []).forEach((c: any) => {
            (c.deliveryModes || []).forEach((m: string) => allModes.add(m));
            (c.subContents || []).forEach((sc: any) => {
                (sc.deliveryModes || []).forEach((m: string) => allModes.add(m));
                (sc.subContents || []).forEach((ssc: any) => {
                    (ssc.deliveryModes || []).forEach((m: string) => allModes.add(m));
                });
            });
        });
        return Array.from(allModes);
    };

    const getTotalDuration = (mod: any) => {
        return (mod.contents || []).reduce((acc: number, c: any) => {
            let subDuration = (c.subContents || []).reduce((sAcc: number, s: any) => {
                let ssDuration = (s.subContents || []).reduce((ssAcc: number, ss: any) => ssAcc + (ss.duration || 0), 0);
                return sAcc + (s.duration || 0) + ssDuration;
            }, 0);
            return acc + (c.duration || 0) + subDuration;
        }, 0);
    };

    return (
        <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center">
                            <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
                            {className} — {t('classOverview.moduleOverview')}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {students.length} {t('classOverview.studentsCompare')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 flex-wrap md:flex-nowrap relative">
                    {students.length > 0 && (
                        <>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${showFilters || studentFilters.length > 0 || moduleFilters.length > 0
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                {t('classOverview.filters')}
                                {(studentFilters.length > 0 || moduleFilters.length > 0) && (
                                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                                        {studentFilters.length + moduleFilters.length}
                                    </span>
                                )}
                            </button>

                            {/* Filter Popover */}
                            {showFilters && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                        <h3 className="font-semibold text-slate-800 flex items-center">
                                            <Settings2 className="w-4 h-4 mr-2 text-slate-500" />
                                            {t('classOverview.filters')}
                                        </h3>
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            {t('classOverview.clearAll')}
                                        </button>
                                    </div>

                                    {/* Students Filter */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">{t('classOverview.filterStudents')}</label>
                                            <button onClick={selectAllStudents} className="text-[10px] text-blue-600 font-medium hover:underline">{t('classOverview.selectAll')}</button>
                                        </div>
                                        <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                            {students.map(s => (
                                                <button
                                                    key={s.student_id}
                                                    onClick={() => toggleStudentFilter(s.student_id)}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${studentFilters.includes(s.student_id) ? 'bg-blue-100/50 text-blue-800' : 'text-slate-600 hover:bg-slate-200/50'}`}
                                                >
                                                    <span className="truncate pr-2">{s.student_name}</span>
                                                    {studentFilters.includes(s.student_id) && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Modules Filter */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">{t('classOverview.filterModules')}</label>
                                            <button onClick={selectAllModules} className="text-[10px] text-blue-600 font-medium hover:underline">{t('classOverview.selectAll')}</button>
                                        </div>
                                        <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                            {Array.from({ length: maxModules }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleModuleFilter(i)}
                                                    className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between ${moduleFilters.includes(i) ? 'bg-blue-100/50 text-blue-800' : 'text-slate-600 hover:bg-slate-200/50'}`}
                                                >
                                                    <span className="truncate pr-2">{t('step4.module')} {i + 1}</span>
                                                    {moduleFilters.includes(i) && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 transition-colors"
                                    >
                                        {t('classOverview.apply')}
                                    </button>
                                </div>
                            )}

                            <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>
                        </>
                    )}
                    <button
                        onClick={toggleAllStudents}
                        className="flex items-center px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                        {allStudentsExpanded ? <FoldVertical className="w-4 h-4 mr-2" /> : <UnfoldVertical className="w-4 h-4 mr-2" />}
                        {allStudentsExpanded ? t('classOverview.collapseAll') : t('classOverview.expandAll')}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-500 text-sm">{t('classOverview.loadingStudentModules')}</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <User className="w-16 h-16 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">{t('classOverview.noStudentsEnrolled')}</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-7xl mx-auto">
                        {students
                            .filter(s => studentFilters.length === 0 || studentFilters.includes(s.student_id))
                            .map((student) => (
                                <div key={student.student_id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                    {/* Student Header */}
                                    <div
                                        className="px-5 py-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-blue-50/50 to-white border-b border-slate-100 hover:from-blue-50 transition-all"
                                        onClick={() => toggleStudent(student.student_id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            {expandedStudents[student.student_id] ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {student.student_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 text-sm">{student.student_name}</p>
                                                <p className="text-xs text-slate-500">{student.student_email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                                {totalModuleCount(student)} {t('classOverview.modules')}
                                            </span>
                                            {student.station_id && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveChatId(activeChatId === student.station_id ? null : student.station_id!);
                                                            if (!expandedStudents[student.student_id]) toggleStudent(student.student_id);
                                                        }}
                                                        className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                                            activeChatId === student.station_id 
                                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                                                        }`}
                                                    >
                                                        <MessageCircle className="w-3 h-3 mr-1.5" /> 
                                                        {t('chat.title') || 'Chat'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onOpenStation(student.station_id!); }}
                                                        className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                                    >
                                                        <FolderOpen className="w-3 h-3 mr-1.5" /> {t('classOverview.openStation')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Student Modules & Chat */}
                                    {expandedStudents[student.student_id] && (
                                        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className={activeChatId === student.station_id ? 'lg:col-span-2' : 'lg:col-span-3'}>
                                                {student.modules.length === 0 ? (
                                                    <p className="text-sm text-slate-400 py-4 text-center italic">{t('classOverview.noModulesYet')}</p>
                                                ) : (
                                                <div className="space-y-3">
                                                    {student.modules.map((mod: any, modIdx: number) => {
                                                        if (moduleFilters.length > 0 && !moduleFilters.includes(modIdx)) return null;

                                                        const moduleKey = `${student.student_id}-${mod.id}`;
                                                        const isModExpanded = expandedModules[moduleKey];
                                                        const duration = getTotalDuration(mod);
                                                        const deliveryModes = getDeliveryModesSummary(mod);

                                                        return (
                                                            <div key={mod.id} className={`border rounded-lg transition-all ${isModExpanded ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'}`}>
                                                                {/* Module Header */}
                                                                <div
                                                                    className="px-4 py-3 flex items-center justify-between cursor-pointer"
                                                                    onClick={() => toggleModule(moduleKey)}
                                                                    data-chat-target={`step-3-mod-${modIdx}-title`}
                                                                    data-chat-name={`Module: ${mod.title || t('classOverview.untitledModule')}`}
                                                                >
                                                                    <div className="flex items-center space-x-3">
                                                                        {isModExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                                        <div className="flex items-center">
                                                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded mr-3">
                                                                                MOD {modIdx + 1}
                                                                            </span>
                                                                            <span className="font-medium text-sm text-slate-800">
                                                                                {mod.title || t('classOverview.untitledModule')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                                                                        <span className="flex items-center"><Box className="w-3 h-3 mr-1" /> {(mod.contents || []).length} {t('classOverview.content')}</span>
                                                                        <span className="flex items-center text-amber-600"><Clock className="w-3 h-3 mr-1" /> {duration} {t('classOverview.min')}</span>
                                                                        {deliveryModes.length > 0 && (
                                                                            <span className="flex items-center text-blue-600 font-medium">
                                                                                <Layers className="w-3 h-3 mr-1" /> {deliveryModes.length} {t('classOverview.modes')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Module Details */}
                                                                {isModExpanded && (
                                                                    <div className="border-t border-slate-200 px-4 py-4 space-y-4 animate-fade-in">
                                                                        {/* Module Metadata */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                            <div 
                                                                                className="bg-white p-3 rounded-lg border border-slate-100"
                                                                                data-chat-target={`step-3-mod-${modIdx}-bloom`}
                                                                                data-chat-name={`Bloom Level (${mod.title || 'Module'})`}
                                                                            >
                                                                                <span className="text-xs font-bold text-slate-400 block mb-1">{t('classOverview.bloomLevel')}</span>
                                                                                <span className="text-sm font-medium text-slate-700">{t(`bloomLevels.${mod.bloomLevel}` as any) || mod.bloomLevel || '-'}</span>
                                                                            </div>
                                                                            <div 
                                                                                className="bg-white p-3 rounded-lg border border-slate-100"
                                                                                data-chat-target={`step-3-mod-${modIdx}-outcome`}
                                                                                data-chat-name={`Learning Outcome (${mod.title || 'Module'})`}
                                                                            >
                                                                                <span className="text-xs font-bold text-slate-400 block mb-1">{t('classOverview.learningOutcome')}</span>
                                                                                <span className="text-sm text-slate-700">{mod.learningOutcome || '-'}</span>
                                                                            </div>
                                                                            <div 
                                                                                className="bg-white p-3 rounded-lg border border-slate-100"
                                                                                data-chat-target={`step-3-mod-${modIdx}-assessment`}
                                                                                data-chat-name={`Assessment (${mod.title || 'Module'})`}
                                                                            >
                                                                                <span className="text-xs font-bold text-slate-400 block mb-1">{t('classOverview.assessment')}</span>
                                                                                <span className="text-sm text-slate-700">{(mod.assessmentMethods || []).join(', ') || '-'}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Contents */}
                                                                        {(mod.contents || []).length > 0 && (
                                                                            <div>
                                                                                <h5 className="text-xs font-bold text-slate-500 mb-2 tracking-wide">{t('classOverview.contentsTitle')}</h5>
                                                                                <div className="space-y-2">
                                                                                    {(mod.contents || []).map((content: any, cIdx: number) => (
                                                                                        <div 
                                                                                            key={content.id} 
                                                                                            className="bg-white p-3 rounded-lg border border-slate-100"
                                                                                            data-chat-target={`step-3-mod-${modIdx}-con-${cIdx}-title`}
                                                                                            data-chat-name={`Content: ${content.title || 'Untitled'}`}
                                                                                        >
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <span className="text-sm font-medium text-slate-800">
                                                                                                    <span className="text-slate-400 mr-2">#{cIdx + 1}</span>
                                                                                                    {content.title || t('classOverview.untitled')}
                                                                                                </span>
                                                                                                <span className="text-xs text-amber-600 font-medium">{content.duration || 0} {t('classOverview.min')}</span>
                                                                                            </div>
                                                                                            {content.deliveryModes && content.deliveryModes.length > 0 && (
                                                                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                                                    {content.deliveryModes.map((mode: string) => (
                                                                                                        <span key={mode} className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                                                                                                            {DELIVERY_MODE_ICONS[mode as keyof typeof DELIVERY_MODE_ICONS] && (
                                                                                                                <span className="mr-1 scale-75">{DELIVERY_MODE_ICONS[mode as keyof typeof DELIVERY_MODE_ICONS]}</span>
                                                                                                            )}
                                                                                                            {t(`deliveryModes.${mode}` as any) || DELIVERY_MODE_LABELS[mode as keyof typeof DELIVERY_MODE_LABELS] || mode}
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                            {/* Sub-Contents */}
                                                                                            {content.subContents && content.subContents.length > 0 && (
                                                                                                <div className="mt-2 pl-3 border-l-2 border-slate-100 space-y-1.5">
                                                                                                    {content.subContents.map((sub: any, sIdx: number) => (
                                                                                                        <div key={sub.id} className="text-xs text-slate-600">
                                                                                                            <div 
                                                                                                                className="flex items-center hover:bg-slate-50 p-1 rounded border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                                                                                                                data-chat-target={`step-3-mod-${modIdx}-con-${cIdx}-sub-${sIdx}-title`}
                                                                                                                data-chat-name={`SubContent: ${sub.title || 'Untitled'}`}
                                                                                                            >
                                                                                                                <span className="text-slate-400 mr-1.5">↳ </span>
                                                                                                                <span className="font-medium mr-2">{sub.title || t('classOverview.untitled')}</span>
                                                                                                                <span className="text-slate-400">{sub.duration || 0} {t('classOverview.min')}</span>
                                                                                                                {sub.deliveryModes && sub.deliveryModes.length > 0 && (
                                                                                                                    <span className="text-itu-cyan ml-2 font-medium">({sub.deliveryModes.length} {t('classOverview.modes')})</span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            
                                                                                                            {/* Sub-Sub-Contents */}
                                                                                                            {sub.subContents && sub.subContents.length > 0 && (
                                                                                                                <div className="pl-5 mt-1 space-y-1 border-l-2 border-slate-50 ml-1.5">
                                                                                                                    {sub.subContents.map((ss: any, ssIdx: number) => (
                                                                                                                        <div 
                                                                                                                            key={ss.id} 
                                                                                                                            className="flex items-center hover:bg-slate-50 p-1 rounded border border-transparent hover:border-slate-200 cursor-pointer transition-colors text-[11px] text-slate-500"
                                                                                                                            data-chat-target={`step-3-mod-${modIdx}-con-${cIdx}-sub-${sIdx}-ss-${ssIdx}-title`}
                                                                                                                            data-chat-name={`SubSubContent: ${ss.title || 'Untitled'}`}
                                                                                                                        >
                                                                                                                            <span className="text-slate-300 mr-1.5">-</span>
                                                                                                                            <span className="font-medium mr-2 max-w-[200px] truncate">{ss.title || t('classOverview.untitled')}</span>
                                                                                                                            <span className="text-slate-300">{ss.duration || 0} {t('classOverview.min')}</span>
                                                                                                                        </div>
                                                                                                                    ))}
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            </div>
                                            {activeChatId === student.station_id && (
                                                <div className="lg:col-span-1 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-[600px] sticky top-6">
                                                    <StationChat stationId={student.station_id} user={user} inline={true} />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};
