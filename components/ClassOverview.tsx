import React, { useState, useEffect } from 'react';
import {
    ChevronDown, ChevronRight, Loader2, X, User, Box, Clock,
    BookOpen, ArrowLeft, FolderOpen, ExternalLink, ChevronUp,
    GraduationCap, Layers, FoldVertical, UnfoldVertical
} from 'lucide-react';
import { getClassOverview } from '../services/authService';
import { DELIVERY_MODE_ICONS, DELIVERY_MODE_LABELS } from '../constants';
import { useTranslation } from 'react-i18next';

interface ClassOverviewProps {
    classId: string;
    className: string;
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

export const ClassOverview: React.FC<ClassOverviewProps> = ({ classId, className, onClose, onOpenStation }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<StudentOverview[]>([]);
    const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({});
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

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
            alert(err.message || 'Failed to load class overview');
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
                            {className} — Module Overview
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {students.length} students • Compare and review all modules
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleAllStudents}
                        className="flex items-center px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                        {allStudentsExpanded ? <FoldVertical className="w-4 h-4 mr-2" /> : <UnfoldVertical className="w-4 h-4 mr-2" />}
                        {allStudentsExpanded ? 'Collapse All' : 'Expand All'}
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
                        <p className="text-slate-500 text-sm">Loading student modules...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <User className="w-16 h-16 mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No students enrolled yet</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-7xl mx-auto">
                        {students.map((student) => (
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
                                            {totalModuleCount(student)} modules
                                        </span>
                                        {student.station_id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onOpenStation(student.station_id!); }}
                                                className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
                                            >
                                                <FolderOpen className="w-3 h-3 mr-1.5" /> Open Station
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Student Modules */}
                                {expandedStudents[student.student_id] && (
                                    <div className="p-4">
                                        {student.modules.length === 0 ? (
                                            <p className="text-sm text-slate-400 py-4 text-center italic">No modules yet</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {student.modules.map((mod: any, modIdx: number) => {
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
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    {isModExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                                    <div className="flex items-center">
                                                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded mr-3">
                                                                            MOD {modIdx + 1}
                                                                        </span>
                                                                        <span className="font-medium text-sm text-slate-800">
                                                                            {mod.title || 'Untitled Module'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-3 text-xs text-slate-500">
                                                                    <span className="flex items-center"><Box className="w-3 h-3 mr-1" /> {(mod.contents || []).length} content</span>
                                                                    <span className="flex items-center text-amber-600"><Clock className="w-3 h-3 mr-1" /> {duration} min</span>
                                                                    {deliveryModes.length > 0 && (
                                                                        <span className="flex items-center text-blue-600 font-medium">
                                                                            <Layers className="w-3 h-3 mr-1" /> {deliveryModes.length} modes
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Module Details */}
                                                            {isModExpanded && (
                                                                <div className="border-t border-slate-200 px-4 py-4 space-y-4 animate-fade-in">
                                                                    {/* Module Metadata */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                            <span className="text-xs font-bold text-slate-400 block mb-1">Bloom Level</span>
                                                                            <span className="text-sm font-medium text-slate-700">{t(`bloomLevels.${mod.bloomLevel}` as any) || mod.bloomLevel || '-'}</span>
                                                                        </div>
                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                            <span className="text-xs font-bold text-slate-400 block mb-1">Learning Outcome</span>
                                                                            <span className="text-sm text-slate-700">{mod.learningOutcome || '-'}</span>
                                                                        </div>
                                                                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                            <span className="text-xs font-bold text-slate-400 block mb-1">Assessment</span>
                                                                            <span className="text-sm text-slate-700">{(mod.assessmentMethods || []).join(', ') || '-'}</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Contents */}
                                                                    {(mod.contents || []).length > 0 && (
                                                                        <div>
                                                                            <h5 className="text-xs font-bold text-slate-500 mb-2 tracking-wide">CONTENTS</h5>
                                                                            <div className="space-y-2">
                                                                                {(mod.contents || []).map((content: any, cIdx: number) => (
                                                                                    <div key={content.id} className="bg-white p-3 rounded-lg border border-slate-100">
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <span className="text-sm font-medium text-slate-800">
                                                                                                <span className="text-slate-400 mr-2">#{cIdx + 1}</span>
                                                                                                {content.title || 'Untitled'}
                                                                                            </span>
                                                                                            <span className="text-xs text-amber-600 font-medium">{content.duration || 0} min</span>
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
                                                                                                        <span className="text-slate-400">↳ </span>
                                                                                                        <span className="font-medium">{sub.title || 'Untitled'}</span>
                                                                                                        <span className="text-slate-400 ml-2">{sub.duration || 0} min</span>
                                                                                                        {sub.deliveryModes && sub.deliveryModes.length > 0 && (
                                                                                                            <span className="text-blue-500 ml-2">({sub.deliveryModes.length} modes)</span>
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
