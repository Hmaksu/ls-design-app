import React, { useState, useEffect } from 'react';
import { X, Mail, Clock, Loader2, Inbox, RefreshCw, Trash2 } from 'lucide-react';

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}

interface AdminMessagesProps {
    onClose: () => void;
}

export const AdminMessages: React.FC<AdminMessagesProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ContactMessage | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('ls_token');
            const res = await fetch('/api/admin/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setMessages(data.messages || []);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMessages(); }, []);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return d; }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <Inbox className="w-5 h-5 mr-2" />
                        Feedback Messages ({messages.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={fetchMessages} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Refresh">
                            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Inbox className="w-12 h-12 mb-3" />
                            <p className="text-lg font-medium">No messages yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Message List */}
                            <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                                {messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        onClick={() => setSelected(msg)}
                                        className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors ${selected?.id === msg.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
                                    >
                                        <p className="text-sm font-semibold text-slate-800 truncate">{msg.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{msg.subject || '(No subject)'}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDate(msg.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Message Detail */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {selected ? (
                                    <div>
                                        <div className="mb-4">
                                            <h4 className="text-xl font-bold text-slate-800">{selected.subject || '(No subject)'}</h4>
                                            <div className="flex items-center space-x-3 mt-2 text-sm text-slate-500">
                                                <span className="flex items-center">
                                                    <Mail className="w-4 h-4 mr-1" />
                                                    <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline">{selected.email}</a>
                                                </span>
                                                <span>•</span>
                                                <span>{selected.name}</span>
                                                <span>•</span>
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {formatDate(selected.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {selected.message}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 h-full">
                                        <p>Select a message to read</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
