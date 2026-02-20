import React, { useState, useEffect } from 'react';
import {
    Plus, FolderOpen, Trash2, Clock, Layers, BookOpen,
    Search, LogOut, User, Loader2, AlertCircle, Share2, Users, X, UserPlus, UserMinus, MessageSquare, Inbox
} from 'lucide-react';
import {
    getStations, deleteStation, StationSummary,
    shareStation, getCollaborators, removeCollaborator, Collaborator
} from '../services/authService';
import { ContactForm } from './ContactForm';
import { AdminMessages } from './AdminMessages';

interface DashboardProps {
    user: { id: number; name: string; email: string };
    onCreateNew: () => void;
    onOpenStation: (id: string) => void;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onCreateNew, onOpenStation, onLogout }) => {
    const [stations, setStations] = useState<StationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Share modal state
    const [shareModalStationId, setShareModalStationId] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [shareError, setShareError] = useState('');
    const [shareLoading, setShareLoading] = useState(false);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collabLoading, setCollabLoading] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [showAdminMessages, setShowAdminMessages] = useState(false);

    useEffect(() => { loadStations(); }, []);

    const loadStations = async () => {
        try {
            setLoading(true);
            const data = await getStations();
            setStations(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load stations');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this station?')) return;
        try {
            setDeletingId(id);
            await deleteStation(id);
            setStations(prev => prev.filter(s => s.id !== id));
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
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
            setShareError(err.message || 'Failed to share');
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
            alert('Failed to remove: ' + err.message);
        }
    };

    const filtered = stations.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">My Learning Stations</h1>
                        <p className="text-sm text-slate-500">Welcome back, {user.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Send Feedback"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">Feedback</span>
                        </button>
                        <button
                            onClick={() => setShowAdminMessages(true)}
                            className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Messages"
                        >
                            <Inbox className="w-4 h-4" />
                            <span className="text-sm font-medium">Inbox</span>
                        </button>
                        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-lg">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700 font-medium">{user.email}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center space-x-1 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto">

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search stations..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            onClick={onCreateNew}
                            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Station
                        </button>
                    </div>

                    {/* Content */}
                    {loading ? (
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
                                {searchTerm ? 'No matching stations' : 'No stations yet'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">
                                {searchTerm ? 'Try a different search term' : 'Create your first learning station to get started'}
                            </p>
                            {!searchTerm && (
                                <button onClick={onCreateNew} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    Create Station
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
                                                    {station.title || 'Untitled Station'}
                                                </h3>
                                                {station.code && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                                                        {station.code}
                                                    </span>
                                                )}
                                                {station.role === 'collaborator' && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium flex items-center">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        Shared{station.owner_name ? ` by ${station.owner_name}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                                                <span className="flex items-center"><Layers className="w-3 h-3 mr-1" />{station.moduleCount} modules</span>
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

            {/* ═══ Share Modal ═══ */}
            {shareModalStationId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShareModalStationId(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Share2 className="w-5 h-5 mr-2 text-blue-600" />
                                Share Station
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
                                    placeholder="Enter email address..."
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
                                    Collaborators ({collaborators.length})
                                </h4>
                                {collabLoading ? (
                                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                                ) : collaborators.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No collaborators yet. Add someone by email above.</p>
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

            {/* ═══ Admin Messages Modal ═══ */}
            {showAdminMessages && (
                <AdminMessages onClose={() => setShowAdminMessages(false)} />
            )}
        </div>
    );
};
