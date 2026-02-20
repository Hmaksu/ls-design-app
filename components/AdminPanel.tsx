import React, { useState, useEffect } from 'react';
import {
    X, Users, Layers, Inbox, Loader2, Search,
    RefreshCw, Clock, Mail, Shield, Database,
    Share2, UserPlus, UserMinus, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import {
    getAdminUsers, getAdminStations, getAdminMessages,
    getAdminStationCollaborators, adminShareStation, adminRemoveCollaborator,
    AdminUser, AdminStation, Collaborator
} from '../services/authService';

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

type AdminTab = 'users' | 'stations' | 'messages';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [tab, setTab] = useState<AdminTab>('users');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stations, setStations] = useState<AdminStation[]>([]);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

    // Share management state
    const [expandedStationId, setExpandedStationId] = useState<string | null>(null);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [collabLoading, setCollabLoading] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareError, setShareError] = useState('');
    const [shareLoading, setShareLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (tab === 'users') {
                const data = await getAdminUsers();
                setUsers(data);
            } else if (tab === 'stations') {
                const data = await getAdminStations();
                setStations(data);
            } else {
                const data = await getAdminMessages();
                setMessages(data);
            }
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tab]);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return d; }
    };

    const TABS: { key: AdminTab; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: users.length },
        { key: 'stations', label: 'Stations', icon: <Layers className="w-4 h-4" />, count: stations.length },
        { key: 'messages', label: 'Messages', icon: <Inbox className="w-4 h-4" />, count: messages.length },
    ];

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const filteredStations = stations.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
        s.owner_email.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    // Share management functions
    const toggleSharePanel = async (stationId: string) => {
        if (expandedStationId === stationId) {
            setExpandedStationId(null);
            setCollaborators([]);
            setShareEmail('');
            setShareError('');
            return;
        }
        setExpandedStationId(stationId);
        setShareEmail('');
        setShareError('');
        setCollabLoading(true);
        try {
            const collabs = await getAdminStationCollaborators(stationId);
            setCollaborators(collabs);
        } catch {
            setCollaborators([]);
        } finally {
            setCollabLoading(false);
        }
    };

    const handleAdminShare = async () => {
        if (!shareEmail.trim() || !expandedStationId) return;
        setShareLoading(true);
        setShareError('');
        try {
            const data = await adminShareStation(expandedStationId, shareEmail.trim());
            setCollaborators(prev => [...prev, data.collaborator]);
            setShareEmail('');
        } catch (err: any) {
            setShareError(err.message || 'Failed to share');
        } finally {
            setShareLoading(false);
        }
    };

    const handleAdminRemoveCollab = async (userId: number) => {
        if (!expandedStationId) return;
        try {
            await adminRemoveCollaborator(expandedStationId, userId);
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        } catch (err: any) {
            alert('Failed to remove: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-cyan-400" />
                        Admin Panel
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={fetchData} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Refresh">
                            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key); setSearch(''); setSelectedMessage(null); setExpandedStationId(null); }}
                            className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium transition-all border-b-2 ${tab === t.key
                                ? 'text-blue-600 border-blue-600 bg-white'
                                : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            {t.icon}
                            <span>{t.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{t.count}</span>
                        </button>
                    ))}
                </div>

                {/* Search (for users/stations) */}
                {tab !== 'messages' && (
                    <div className="px-6 py-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={tab === 'users' ? 'Search users by name or email...' : 'Search stations by title, code, or owner...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* ═══ USERS TAB ═══ */}
                            {tab === 'users' && (
                                <table className="w-full">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                            <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                            <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stations</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredUsers.length === 0 ? (
                                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No users found</td></tr>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                {u.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-800">{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-slate-600">{u.email}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                                                            <Database className="w-3 h-3 mr-1" />{u.station_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-slate-500 flex items-center">
                                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />{formatDate(u.created_at)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* ═══ STATIONS TAB ═══ */}
                            {tab === 'stations' && (
                                <div className="divide-y divide-slate-100">
                                    {filteredStations.length === 0 ? (
                                        <div className="px-6 py-12 text-center text-slate-400">No stations found</div>
                                    ) : (
                                        filteredStations.map(s => (
                                            <div key={s.id}>
                                                {/* Station Row */}
                                                <div className="flex items-center px-6 py-3 hover:bg-slate-50 transition-colors">
                                                    <div className="flex-1 min-w-0 grid grid-cols-6 gap-4 items-center">
                                                        <span className="text-sm font-medium text-slate-800 truncate">{s.title || '(Untitled)'}</span>
                                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 text-center">{s.code || '—'}</span>
                                                        <div>
                                                            <p className="text-sm text-slate-700">{s.owner_name}</p>
                                                            <p className="text-xs text-slate-400">{s.owner_email}</p>
                                                        </div>
                                                        <span className="text-sm text-slate-600 text-center">{s.moduleCount} modules</span>
                                                        <span className="text-center">
                                                            {s.level ? (
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.level === 'Advanced' ? 'bg-red-50 text-red-700' : s.level === 'Intermediate' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                                                                    {s.level}
                                                                </span>
                                                            ) : <span className="text-slate-400 text-xs">—</span>}
                                                        </span>
                                                        <span className="text-sm text-slate-500 flex items-center">
                                                            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />{formatDate(s.updated_at)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleSharePanel(s.id)}
                                                        className={`ml-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${expandedStationId === s.id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
                                                            }`}
                                                        title="Manage sharing"
                                                    >
                                                        <Share2 className="w-3.5 h-3.5" />
                                                        <span>Share</span>
                                                        {expandedStationId === s.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                </div>

                                                {/* Expanded Share Panel */}
                                                {expandedStationId === s.id && (
                                                    <div className="px-6 pb-4 bg-blue-50/50 border-t border-blue-100">
                                                        <div className="max-w-lg mx-auto py-4">
                                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                                                                <Share2 className="w-4 h-4 mr-1.5 text-blue-600" />
                                                                Manage Collaborators — {s.title || '(Untitled)'}
                                                            </h4>

                                                            {/* Add collaborator input */}
                                                            <div className="flex space-x-2 mb-3">
                                                                <input
                                                                    type="email"
                                                                    placeholder="Enter email to add..."
                                                                    value={shareEmail}
                                                                    onChange={e => setShareEmail(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleAdminShare()}
                                                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                                />
                                                                <button
                                                                    onClick={handleAdminShare}
                                                                    disabled={shareLoading || !shareEmail.trim()}
                                                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
                                                            {collabLoading ? (
                                                                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                                                            ) : collaborators.length === 0 ? (
                                                                <p className="text-sm text-slate-400 text-center py-3">No collaborators. Add by email above.</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {collaborators.map(collab => (
                                                                        <div key={collab.id} className="flex items-center justify-between px-3 py-2.5 bg-white rounded-lg border border-slate-100">
                                                                            <div className="flex items-center space-x-3">
                                                                                <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                                    {collab.name.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-slate-700">{collab.name}</p>
                                                                                    <p className="text-xs text-slate-400">{collab.email}</p>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleAdminRemoveCollab(collab.id)}
                                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                                title="Remove collaborator"
                                                                            >
                                                                                <UserMinus className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* ═══ MESSAGES TAB ═══ */}
                            {tab === 'messages' && (
                                <div className="flex h-[50vh]">
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                            <Inbox className="w-12 h-12 mb-3" />
                                            <p className="text-lg font-medium">No messages yet</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                                                {messages.map(msg => (
                                                    <div
                                                        key={msg.id}
                                                        onClick={() => setSelectedMessage(msg)}
                                                        className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                                                    >
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{msg.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{msg.subject || '(No subject)'}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />{formatDate(msg.created_at)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex-1 p-6 overflow-y-auto">
                                                {selectedMessage ? (
                                                    <div>
                                                        <div className="mb-4">
                                                            <h4 className="text-xl font-bold text-slate-800">{selectedMessage.subject || '(No subject)'}</h4>
                                                            <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500">
                                                                <span className="flex items-center">
                                                                    <Mail className="w-4 h-4 mr-1" />
                                                                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">{selectedMessage.email}</a>
                                                                </span>
                                                                <span>•</span>
                                                                <span>{selectedMessage.name}</span>
                                                                <span>•</span>
                                                                <span className="flex items-center">
                                                                    <Clock className="w-3 h-3 mr-1" />{formatDate(selectedMessage.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                            {selectedMessage.message}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-slate-400">
                                                        <p>Select a message to read</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer with stats */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
                    <span>
                        {tab === 'users' && `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`}
                        {tab === 'stations' && `${filteredStations.length} station${filteredStations.length !== 1 ? 's' : ''}`}
                        {tab === 'messages' && `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
                    </span>
                    <span className="text-slate-400">Learning Station Designer • Admin</span>
                </div>
            </div>
        </div>
    );
};
