import React, { useState, useEffect } from 'react';
import {
    Plus, FolderOpen, Trash2, Clock, Layers, BookOpen, Globe,
    Search, LogOut, User, Loader2, AlertCircle, Share2, Users, X, UserPlus, UserMinus, MessageSquare, Shield, GraduationCap, FileEdit, Bell,
    Bug,
    Database
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    getStations, getPublishedStations, deleteStation, StationSummary,
    shareStation, getCollaborators, removeCollaborator, Collaborator,
    getClasses, createClass, getClassDetails, addClassMember, removeClassMember
} from '../services/authService';
import { ClassEntity, ClassMember } from '../types';
import { ContactForm } from './ContactForm';
import { AdminPanel } from './AdminPanel';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ClassOverview } from './ClassOverview';

interface DashboardProps {
    user: { id: number; name: string; email: string; role?: string };
    onCreateNew: () => void;
    onOpenStation: (id: string) => void;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onCreateNew, onOpenStation, onLogout }) => {
    const { t, i18n } = useTranslation();
    const [stations, setStations] = useState<StationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'mine' | 'community' | 'classes'>('mine');
    const [publishedStations, setPublishedStations] = useState<StationSummary[]>([]);

    // Classes state
    const [classesData, setClassesData] = useState<{ owned: ClassEntity[]; joined: ClassEntity[] }>({ owned: [], joined: [] });
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassBaseId, setNewClassBaseId] = useState('');
    const [creatingClass, setCreatingClass] = useState(false);

    // Class Manager Modal state
    const [manageClassId, setManageClassId] = useState<string | null>(null);
    const [classDetails, setClassDetails] = useState<{ class: ClassEntity; members: ClassMember[]; role: 'instructor' | 'student'; studentStationId: string | null } | null>(null);
    const [classLoading, setClassLoading] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    // Share modal state
    const [shareModalStationId, setShareModalStationId] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [shareError, setShareError] = useState('');
    const [shareLoading, setShareLoading] = useState(false);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collabLoading, setCollabLoading] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [overviewClassId, setOverviewClassId] = useState<string | null>(null);
    const [overviewClassName, setOverviewClassName] = useState('');

    // Updates Modal
    const [showUpdatesModal, setShowUpdatesModal] = useState(false);

    // Helper: convert string to URL-friendly slug
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            const state = e.state;
            if (!state) {
                if (window.location.pathname === '/dashboard') {
                    setManageClassId(null);
                    setOverviewClassId(null);
                }
                return;
            }
            if (state.view === 'dashboard') {
                if (state.subView === 'manageClass' && state.classId) {
                    setOverviewClassId(null);
                    openClassManager(state.classId, true);
                } else if (state.subView === 'overviewClass' && state.classId) {
                    setManageClassId(null);
                    openClassOverview(state.classId, state.className || '', true);
                } else {
                    setManageClassId(null);
                    setOverviewClassId(null);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Handle initial deep links after data loads
    useEffect(() => {
        if (!classesData.owned.length) return;

        const path = window.location.pathname;
        if (path.startsWith('/dashboard/class/')) {
            const parts = path.split('/');

            if (parts[2] === 'class') {
                const slug = decodeURIComponent(parts[3] || '');
                const isOverview = parts[4] === 'overview';

                const foundClass = classesData.owned.find(c => slugify(c.name) === slug);
                if (foundClass) {
                    if (isOverview) {
                        window.history.replaceState({ view: 'dashboard', subView: 'overviewClass', classId: foundClass.id, className: foundClass.name }, '', path);
                        openClassOverview(foundClass.id, foundClass.name, true);
                    } else {
                        window.history.replaceState({ view: 'dashboard', subView: 'manageClass', classId: foundClass.id }, '', path);
                        openClassManager(foundClass.id, true);
                    }
                }
            }
        }
    }, [classesData]);

    useEffect(() => {
        loadStations();
        const hasSeenUpdates = localStorage.getItem('hasSeenUpdates_v3.1.1');
        if (!hasSeenUpdates) {
            setShowUpdatesModal(true);
        }
    }, []);

    const handleCloseUpdates = () => {
        localStorage.setItem('hasSeenUpdates_v3.1.1', 'true');
        setShowUpdatesModal(false);
    };

    const loadStations = async () => {
        try {
            setLoading(true);
            const [myStations, communityStations, clsData] = await Promise.all([
                getStations(),
                getPublishedStations(),
                getClasses()
            ]);
            setStations(myStations);
            setPublishedStations(communityStations);
            setClassesData(clsData);
        } catch (err: any) {
            setError(err.message || t('dashboard.failedToLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('dashboard.confirmDelete'))) return;
        try {
            setDeletingId(id);
            await deleteStation(id);
            setStations(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert(t('dashboard.failedToDelete') + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // --- Share Modal ---
    const openShareModal = async (stationId: string) => {
        setShareModalStationId(stationId);
        setShareEmail('');
        setShareError('');
        setCollabLoading(true);
        try {
            const collabs = await getCollaborators(stationId);
            setCollaborators(collabs);
        } catch {
            setCollaborators([]);
        } finally {
            setCollabLoading(false);
        }
    };

    const handleShare = async () => {
        if (!shareEmail.trim() || !shareModalStationId) return;
        setShareLoading(true);
        setShareError('');
        try {
            const data = await shareStation(shareModalStationId, shareEmail.trim());
            setCollaborators(prev => [...prev, data.collaborator]);
            setShareEmail('');
        } catch (err: any) {
            setShareError(err.message || t('dashboard.failedToShare'));
        } finally {
            setShareLoading(false);
        }
    };

    const handleRemoveCollaborator = async (userId: number) => {
        if (!shareModalStationId) return;
        try {
            await removeCollaborator(shareModalStationId, userId);
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        } catch (err: any) {
            alert(t('dashboard.failedToRemove') + err.message);
        }
    };

    // --- Classes Modal Handlers ---
    const handleCreateClass = async () => {
        if (!newClassName.trim() || !newClassBaseId) return;
        setCreatingClass(true);
        try {
            await createClass(newClassName.trim(), newClassBaseId);
            setShowCreateClass(false);
            setNewClassName('');
            setNewClassBaseId('');
            loadStations(); // reload everything
        } catch (err: any) {
            alert(err.message || t('dashboard.failedToCreateClass'));
        } finally {
            setCreatingClass(false);
        }
    };

    const openClassManager = async (classId: string, fromHistory = false) => {
        setManageClassId(classId);

        const cls = classesData.owned.find(c => c.id === classId);
        if (cls && !fromHistory) {
            window.history.pushState(
                { view: 'dashboard', subView: 'manageClass', classId },
                '',
                `/dashboard/class/${encodeURIComponent(slugify(cls.name))}`
            );
        }

        setClassLoading(true);
        setClassDetails(null);
        setNewMemberEmail('');
        try {
            const data = await getClassDetails(classId);
            setClassDetails(data);
        } catch (err: any) {
            alert(err.message || t('dashboard.failedToLoadClass'));
            setManageClassId(null);
        } finally {
            setClassLoading(false);
        }
    };

    const closeClassManager = () => {
        setManageClassId(null);
        window.history.pushState({ view: 'dashboard', step: 1 }, '', '/dashboard');
    };

    const openClassOverview = (classId: string, name: string, fromHistory = false) => {
        setManageClassId(null);
        setOverviewClassId(classId);
        setOverviewClassName(name);
        if (!fromHistory) {
            window.history.pushState(
                { view: 'dashboard', subView: 'overviewClass', classId, className: name },
                '',
                `/dashboard/class/${encodeURIComponent(slugify(name))}/overview`
            );
        }
    };

    const closeClassOverview = () => {
        setOverviewClassId(null);
        window.history.pushState({ view: 'dashboard', step: 1 }, '', '/dashboard');
    };

    const handleAddMember = async () => {
        if (!newMemberEmail.trim() || !manageClassId) return;
        setAddingMember(true);
        try {
            const res = await addClassMember(manageClassId, newMemberEmail.trim());
            if (classDetails) {
                setClassDetails({ ...classDetails, members: [...classDetails.members, res.member] });
            }
            setClassesData(prev => ({
                ...prev,
                owned: prev.owned.map(c => c.id === manageClassId ? { ...c, student_count: (c.student_count || 0) + 1 } : c)
            }));
            setNewMemberEmail('');
        } catch (err: any) {
            alert(err.message || t('dashboard.failedToAddStudent'));
        } finally {
            setAddingMember(false);
        }
    };

    const handleRemoveMemberUser = async (userId: number) => {
        if (!manageClassId) return;
        if (!confirm(t('dashboard.confirmRemoveStudent'))) return;
        try {
            await removeClassMember(manageClassId, userId);
            if (classDetails) {
                setClassDetails({ ...classDetails, members: classDetails.members.filter(m => m.id !== userId) });
            }
            setClassesData(prev => ({
                ...prev,
                owned: prev.owned.map(c => c.id === manageClassId ? { ...c, student_count: Math.max(0, (c.student_count || 1) - 1) } : c)
            }));
        } catch (err: any) {
            alert(err.message || t('dashboard.failedToRemoveStudent'));
        }
    };

    const currentList = activeTab === 'mine' ? stations : publishedStations;
    const filtered = currentList.filter(s =>
        (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{t('header.title')}</h1>
                        <p className="text-sm text-slate-500">{t('dashboard.welcome')}, {user.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <LanguageSwitcher variant="dashboard" />
                        <button
                            onClick={() => setShowUpdatesModal(true)}
                            className="flex items-center space-x-1 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="What's New"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="text-sm font-medium">Updates</span>
                        </button>
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Send Feedback"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('nav.feedback')}</span>
                        </button>
                        {user.role === 'admin' && (
                            <button
                                onClick={() => setShowAdminPanel(true)}
                                className="flex items-center space-x-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Admin Panel"
                            >
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">Admin</span>
                            </button>
                        )}
                        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-lg">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700 font-medium">{user.email}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-1 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">{t('dashboard.logout')}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">

                    {/* Tabs */}
                    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'mine' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('dashboard.myStations')}
                        </button>
                        <button
                            onClick={() => setActiveTab('community')}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'community' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-4 h-4" />
                            <span>{t('dashboard.community')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'classes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            <span>{t('dashboard.myClasses')}</span>
                        </button>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'classes' ? t('dashboard.searchClasses') : t('dashboard.searchStations')}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        {activeTab === 'mine' && (
                            <button
                                onClick={onCreateNew}
                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('dashboard.createNew')}
                            </button>
                        )}
                        {activeTab === 'classes' && (
                            <button
                                onClick={() => setShowCreateClass(true)}
                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('dashboard.createClass')}
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    {activeTab === 'classes' ? (
                        <div className="space-y-8">
                            {/* Owned Classes */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-blue-600" /> {t('dashboard.classesITeach')}
                                </h2>
                                {classesData.owned.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <p className="text-sm text-slate-500">{t('dashboard.noClassesFound')}</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {classesData.owned.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cls => (
                                            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-800">{cls.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-1">{t('dashboard.baseStation')}{cls.base_ls_title}</p>
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center">
                                                        <Users className="w-3 h-3 mr-1" /> {cls.student_count || 0} {t('dashboard.students')}
                                                    </p>
                                                </div><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <button
                                                        onClick={() => openClassOverview(cls.id, cls.name)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        {t('dashboard.moduleOverview')}
                                                    </button>
                                                    <button
                                                        onClick={() => openClassManager(cls.id)}
                                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                                                    >
                                                        {t('dashboard.manageClass')}
                                                    </button></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Joined Classes */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-purple-600" /> {t('dashboard.classesJoined')}
                                </h2>
                                {classesData.joined.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                    <p className="text-sm text-slate-500">{t('dashboard.noJoinedClasses')}</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {classesData.joined.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cls => (
                                            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-800">{cls.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-1">{t('dashboard.instructor')}{cls.instructor_name}</p>
                                                </div>
                                                <button
                                                    onClick={() => cls.student_station_id ? onOpenStation(cls.student_station_id) : alert(t('dashboard.stationNotFound'))}
                                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    <FileEdit className="w-4 h-4 mr-2" /> {t('dashboard.openWorkspace')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500">
                            <AlertCircle className="w-12 h-12 mb-3" />
                            <p>{error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-500 mb-2">
                                {searchTerm ? t('dashboard.noMatchingStations') : t('dashboard.noStationsYet')}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {searchTerm ? t('dashboard.tryDifferentSearch') : t('dashboard.createFirstStation')}
                            </p>
                            {!searchTerm && activeTab === 'mine' && (
                                <button onClick={onCreateNew} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    {t('dashboard.createStation')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filtered.map(station => (
                                <div
                                    key={station.id}
                                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenStation(station.id)}>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3 className="text-lg font-semibold text-slate-800 truncate">
                                                    {station.title || t('dashboard.untitledStation')}
                                                </h3>
                                                {station.code && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                                                        {station.code}
                                                    </span>
                                                )}
                                                {station.role === 'collaborator' && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium flex items-center">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {t('dashboard.shared')}{station.owner_name ? ` ${t('dashboard.sharedBy').toLowerCase()} ${station.owner_name}` : ''}
                                                    </span>
                                                )}
                                                {station.role === 'viewer' && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium flex items-center">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {t('dashboard.published')}{station.owner_name ? ` ${t('dashboard.publishedBy').toLowerCase()} ${station.owner_name}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                                                <span className="flex items-center"><Layers className="w-3 h-3 mr-1" />{station.moduleCount} {t('dashboard.modules')}</span>
                                                {station.level && <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{station.level}</span>}
                                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{formatDate(station.updated_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                            {station.role === 'owner' && (
                                                <button
                                                    onClick={() => openShareModal(station.id)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Share"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onOpenStation(station.id)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Open"
                                            >
                                                <FolderOpen className="w-4 h-4" />
                                            </button>
                                            {station.role === 'owner' && (
                                                <button
                                                    onClick={() => handleDelete(station.id)}
                                                    disabled={deletingId === station.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {deletingId === station.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <footer className="w-full text-slate-500 py-8 mt-auto border-t border-slate-200 bg-transparent">
                <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-4">
                    <div className="text-center text-sm">
                        <p>All translations were generated with AI. Please let us know if you notice any errors or inconsistencies.</p>
                        <p>&copy; {new Date().getFullYear()} <u><a href="https://polen.itu.edu.tr/entities/publication/885d18fb-c6c0-4d0e-87d6-bd36b1781937" target="_blank">Learning Station</a></u> Design Tool.</p>
                    </div>
                </div>
            </footer>

            {/* ═══ Share Modal ═══ */}
            {shareModalStationId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShareModalStationId(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Share2 className="w-5 h-5 mr-2 text-blue-600" />
                                {t('dashboard.shareStation')}
                            </h3>
                            <button onClick={() => setShareModalStationId(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Add collaborator */}
                            <div className="flex space-x-2 mb-4">
                                <input
                                    type="email"
                                    placeholder={t('dashboard.enterEmail')}
                                    value={shareEmail}
                                    onChange={e => setShareEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleShare()}
                                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleShare}
                                    disabled={shareLoading || !shareEmail.trim()}
                                    className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                >
                                    {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                </button>
                            </div>

                            {shareError && (
                                <p className="text-sm text-red-500 mb-3 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" /> {shareError}
                                </p>
                            )}

                            {/* Collaborators list */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {t('dashboard.collaborators')} ({collaborators.length})
                                </h4>
                                {collabLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                                ) : collaborators.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">{t('dashboard.noCollabs')}</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {collaborators.map(collab => (
                                            <div key={collab.id} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{collab.name}</p>
                                                    <p className="text-xs text-slate-400">{collab.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCollaborator(collab.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Contact Form Modal ═══ */}
            {showContactForm && (
                <ContactForm
                    onClose={() => setShowContactForm(false)}
                    userName={user.name}
                    userEmail={user.email}
                />
            )}

            {/* ═══ Admin Panel Modal ═══ */}
            {showAdminPanel && (
                <AdminPanel onClose={() => setShowAdminPanel(false)} />
            )}
            {/* ═══ Create Class Modal ═══ */}
            {showCreateClass && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('dashboard.createNewClass')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dashboard.className')}</label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={e => setNewClassName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={t('dashboard.classNamePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('dashboard.baseLearningStation')}</label>
                                <select
                                    value={newClassBaseId}
                                    onChange={e => setNewClassBaseId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('dashboard.selectStation')}</option>
                                    {stations.map(s => (
                                        <option key={s.id} value={s.id}>{s.title || s.code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowCreateClass(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">{t('dashboard.cancel')}</button>
                            <button
                                onClick={handleCreateClass}
                                disabled={creatingClass || !newClassName || !newClassBaseId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {creatingClass ? t('dashboard.creating') : t('dashboard.createClass')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Manage Class Modal ═══ */}
            {manageClassId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeClassManager}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                                {classLoading ? 'Loading...' : classDetails?.class?.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                                {classDetails && classDetails.role === 'instructor' && classDetails.members.length > 0 && (
                                    <button
                                        onClick={() => openClassOverview(manageClassId, classDetails.class.name)}
                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5 mr-1.5" /> {t('dashboard.moduleOverview')}
                                    </button>
                                )}
                                <button onClick={closeClassManager} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            {classLoading ? (
                                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
                            ) : classDetails && (
                                <div className="space-y-6">
                                    {/* Add Student Form */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('dashboard.addStudent')}</h4>
                                        <div className="flex space-x-2">
                                            <input
                                                type="email"
                                                placeholder={t('dashboard.studentEmailPlaceholder')}
                                                value={newMemberEmail}
                                                onChange={e => setNewMemberEmail(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleAddMember}
                                                disabled={addingMember || !newMemberEmail.trim()}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                            >
                                                {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />} {t('dashboard.add')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Students List */}
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                            <h4 className="text-sm font-semibold text-slate-700">{t('dashboard.enrolledStudents')} ({classDetails.members.length})</h4>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {classDetails.members.length === 0 ? (
                                                <p className="text-center py-6 text-sm text-slate-500">{t('dashboard.noStudentsJoined')}</p>
                                            ) : (
                                                classDetails.members.map(member => (
                                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                        <div>
                                                            <p className="font-medium text-slate-800 text-sm">{member.name}</p>
                                                            <p className="text-xs text-slate-500">{member.email}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            {member.station_id && (
                                                                <button
                                                                    onClick={() => onOpenStation(member.station_id!)}
                                                                    className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                                                                >
                                                                    <FolderOpen className="w-3 h-3 mr-1" /> {t('dashboard.viewWorkspace')}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleRemoveMemberUser(member.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title={t('dashboard.removeStudent')}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Class Overview Full-Screen ═══ */}
            {overviewClassId && (
                <ClassOverview
                    classId={overviewClassId}
                    className={overviewClassName}
                    user={user}
                    onClose={closeClassOverview}
                    onOpenStation={(stationId) => { closeClassOverview(); onOpenStation(stationId); }}
                />
            )}

            {/* ═══ Updates Modal ═══ */}
            {showUpdatesModal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={handleCloseUpdates}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <span className="text-xl mr-2">🚀</span> Version 3.1.1 Released
                                </h3>
                                <button
                                    onClick={handleCloseUpdates}
                                    className="p-1 hover:bg-white rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                                Here are a few important updates about the latest release:
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mt-0.5 mr-3 text-blue-600">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        New Messaging Feature in Stations
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                        We have introduced a dedicated messaging feature within Stations, designed to enhance productivity, streamline communication, and foster better co-creation.                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-pink-200 flex items-center justify-center mt-0.5 mr-3 text-pink-600">
                                    <Bug className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Minor bug fixes and performance improvements.
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                        We’ve resolved a few minor bugs to ensure a smoother experience. You can print your LS as a PDF, just as in previous versions.<br>
                                        </br>The option to add multiple links to delivery modes is temporarily disabled. If you need any assistance, please don’t hesitate to contact us.</p>                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mt-0.5 mr-3 text-amber-600">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Language Improvements in Progress
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                        There may still be some language-related issues in certain parts of
                                        the platform. We are actively working on them, and English is
                                        currently the most stable language.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center mt-0.5 mr-3 text-rose-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Need Help? Contact Us
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                        If you notice any issues in files you are currently working on, such
                                        as errors, white screens, or unexpected behavior, please contact us
                                        via feedback button on top or email us at{" "}
                                        <a
                                            href="mailto:mehmet.aksu@learningstations.org"
                                            className="text-blue-600 hover:underline"
                                        >
                                            mehmet.aksu@learningstations.org
                                        </a>.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleCloseUpdates}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto shadow-sm"
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
