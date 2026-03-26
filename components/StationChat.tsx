import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, X, Loader2, Crosshair, MapPin, Pencil, Trash2, Check, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getStationMessages, postStationMessage, editStationMessage, deleteStationMessage, StationMessage, AuthUser } from '../services/authService';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import parse, { domToReact, Element, DOMNode } from 'html-react-parser';

interface StationChatProps {
  stationId: string;
  user: AuthUser | null;
  inline?: boolean;
}

export function StationChat({ stationId, user, inline = false }: StationChatProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastId, setLastId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inline) {
      window.dispatchEvent(new CustomEvent('ls-chat-toggle', { detail: isOpen }));
    }
  }, [isOpen, inline]);

  const fetchMessages = async (after: number = 0) => {
    try {
      const newMsgs = await getStationMessages(stationId, after);
      if (newMsgs.length > 0) {
        setMessages(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(m => m.id));
          const filtered = newMsgs.filter(m => !existingIds.has(m.id));
          return [...prev, ...filtered].sort((a, b) => a.id - b.id);
        });
        
        const maxId = Math.max(...newMsgs.map(m => m.id));
        setLastId(maxId);

        if (!isOpen) {
          // Add to unread only for messages NOT from the current user
          const othersMsgs = newMsgs.filter(m => m.user_id !== user?.id);
          if (othersMsgs.length > 0) {
            setUnreadCount(prev => prev + othersMsgs.length);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Initial fetch and start polling
  useEffect(() => {
    if (!stationId || !user) return;
    
    setLoading(true);
    fetchMessages(0).finally(() => setLoading(false));

    pollIntervalRef.current = window.setInterval(() => {
      setLastId(currentLastId => {
        fetchMessages(currentLastId);
        return currentLastId; // React state trick is needed in setInterval without deps, 
        // but we can just use a mutable ref for lastId. Let's fix this in the next refactor.
      });
    }, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [stationId, user]);

  // Actually use a ref for lastId to make polling predictable
  const lastIdRef = useRef(lastId);
  useEffect(() => {
    lastIdRef.current = lastId;
  }, [lastId]);

  // Re-define polling with ref
  useEffect(() => {
    if (!stationId || !user) return;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = window.setInterval(() => {
      fetchMessages(lastIdRef.current);
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [stationId, user]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isSelecting) return;

    const handleClick = (e: MouseEvent) => {
      // Don't intercept clicks inside the chat itself, but chat is usually what we DON'T want to annotate
      const target = e.target as HTMLElement;
      if (target.closest('.chat-container') && !target.closest('.annotate-btn')) {
         // clicking inside the chat, maybe let it through unless they click annotate button again
      } else {
         e.preventDefault();
         e.stopPropagation();
         
         const chatTarget = target.closest('[data-chat-target]');
         if (chatTarget) {
           const id = chatTarget.getAttribute('data-chat-target');
           const name = chatTarget.getAttribute('data-chat-name');
           if (id && name) {
             setNewMessage(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + `@[[${id}||${name}]] `);
           }
         }
         setIsSelecting(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSelecting(false);
    };

    document.documentElement.style.cursor = 'crosshair';
    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('keydown', handleKey);

    return () => {
      document.documentElement.style.cursor = '';
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSelecting]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || newMessage === '<p><br></p>') return;

    setSending(true);
    try {
      const msg = await postStationMessage(stationId, newMessage.trim());
      setNewMessage('');
      setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      setLastId(Math.max(lastIdRef.current, msg.id));
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (msgId: number) => {
    if (!editText.trim() || editText === '<p><br></p>') return;
    try {
      const updated = await editStationMessage(stationId, msgId, editText.trim());
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m));
      setEditingMsgId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDelete = async (msgId: number) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteStationMessage(stationId, msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return time;
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
    } catch { return ''; }
  };

  const renderMessageContent = (message: string, isMe: boolean) => {
    // 1. First inject a span with data attributes in place of the text token
    const htmlWithTokens = message.replace(
      /@\[\[(.*?)\|\|(.*?)\]\]/g, 
      '<span data-annotation-id="$1" data-annotation-name="$2"></span>'
    );

    // 2. Options to parse the string to React nodes
    const options = {
      replace: (domNode: DOMNode) => {
        if (domNode instanceof Element && domNode.attribs && domNode.attribs['data-annotation-id']) {
          const id = domNode.attribs['data-annotation-id'];
          const name = domNode.attribs['data-annotation-name'];
          return (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('ls-navigate', { detail: id }))}
              className={`inline-flex items-center align-middle text-[11px] font-bold px-2 py-0.5 rounded shadow-sm mx-1 my-0.5 transition-colors ${
                isMe ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30' : 'bg-itu-blue/10 hover:bg-itu-blue/20 text-itu-blue border border-itu-blue/20'
              }`}
              title={`Navigates to ${name}`}
            >
              <MapPin className="w-3 h-3 mr-1" />
              {name}
            </button>
          );
        }
      }
    };
    
    // Parse replacing spans with active React interaction buttons.
    // Wrap in a div that resets lists and basic styles so quill content displays correctly
    return (
      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1" style={{ fontSize: 'inherit', color: 'inherit' }}>
        {parse(htmlWithTokens, options)}
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      <div 
        className={
          inline 
            ? "flex flex-col h-full w-full inset-0" 
            : `fixed top-0 right-0 h-screen bg-slate-50 shadow-2xl border-l border-slate-200 z-40 ${isMounted ? 'transition-transform duration-300 ease-in-out' : ''} flex flex-col max-w-full overflow-hidden ${
                isOpen ? 'translate-x-0 w-full md:w-80 lg:w-[33.33vw]' : 'translate-x-full w-full md:w-80 lg:w-[33.33vw]'
              }`
        }
      >
        <div className={`flex flex-col h-full ${inline ? 'bg-white rounded-xl shadow-sm border border-slate-200' : 'bg-slate-50'} overflow-hidden`}>
          {/* Header */}
          <div className="bg-itu-blue text-white px-5 py-4 flex justify-between items-center shrink-0 shadow-sm z-10">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-100" />
              <h3 className="font-bold text-base tracking-wide">{t('chat.title') || 'Station Chat'}</h3>
            </div>
            {!inline && (
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Messages List */}
          <div ref={messagesContainerRef} className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col space-y-4">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-itu-cyan" />
                <span className="text-sm">{t('chat.loading') || 'Loading messages...'}</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                <MessageCircle className="w-10 h-10 mb-3 text-slate-300 mx-auto" />
                {t('chat.noMessages') || 'No messages yet. Start the conversation!'}
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === user.id;
                const isEditing = editingMsgId === msg.id;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[90%] group ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {isMe ? (t('chat.you') || 'You') : msg.user_name}
                      </span>
                      <span className="text-[9px] text-slate-300">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm relative ${isMe ? 'bg-itu-cyan text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                      {msg.reference_target && (
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('ls-navigate', { detail: msg.reference_target! }))}
                          className={`flex items-center text-[10px] font-bold px-2 py-1 rounded mb-2 transition-colors ${
                             isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-itu-blue/10 hover:bg-itu-blue/20 text-itu-blue'
                          }`}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {msg.reference_target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      )}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editText} 
                            onChange={(e) => setEditText(e.target.value)} 
                            className="w-full p-2 text-sm text-slate-900 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-itu-cyan" 
                            rows={3}
                            autoFocus
                          />
                          <div className="flex space-x-2 justify-end">
                            <button onClick={() => { setEditingMsgId(null); setEditText(''); }} className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors flex items-center">
                              <XCircle className="w-3 h-3 mr-1" /> Cancel
                            </button>
                            <button onClick={() => handleEdit(msg.id)} className="px-2 py-1 text-xs bg-itu-blue text-white rounded hover:bg-blue-800 transition-colors flex items-center">
                              <Check className="w-3 h-3 mr-1" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderMessageContent(msg.message, isMe)
                      )}
                    </div>
                    {/* Edit/Delete buttons — only for own messages, not while editing */}
                    {isMe && !isEditing && (
                      <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingMsgId(msg.id); setEditText(msg.message); }}
                          className="p-1 text-slate-400 hover:text-itu-blue rounded transition-colors" 
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col justify-end shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <style>{`
              .chat-quill .ql-editor {
                min-height: 48px;
                max-height: 120px;
                padding: 10px 14px;
                font-size: 14px;
                overflow-y: auto;
              }
              .chat-quill .ql-toolbar {
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
                border-color: #e2e8f0;
                padding: 6px;
                background-color: #f8fafc;
              }
              .chat-quill .ql-container {
                border-bottom-left-radius: 0.5rem;
                border-bottom-right-radius: 0.5rem;
                border-color: #e2e8f0;
              }
            `}</style>
            <form onSubmit={handleSend} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                 <button
                  type="button"
                  onClick={() => setIsSelecting(!isSelecting)}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center shrink-0 border ${isSelecting ? 'bg-itu-cyan text-white border-transparent shadow-inner' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm'}`}
                  title={isSelecting ? 'Selecting Target...' : 'Select Target'}
                >
                  <Crosshair className={`w-4 h-4 mr-1.5 ${isSelecting ? 'animate-pulse' : ''}`} />
                  <span className="text-[11px] font-bold tracking-widest">{isSelecting ? 'SELECTING...' : 'ANNOTATE ELEMENT'}</span>
                </button>
              </div>
              <div className="w-full relative shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-lg">
                 <ReactQuill 
                   theme="snow"
                   value={newMessage}
                   onChange={setNewMessage}
                   className="chat-quill bg-white"
                   modules={{ toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link']] }}
                   placeholder={t('chat.placeholder') || 'Type a message...'}
                 />
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || newMessage === '<p><br></p>'}
                  className="px-6 py-2.5 bg-itu-blue text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 shadow-md font-bold tracking-wide text-xs"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {t('chat.send') || 'SEND MESSAGE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toggle Button for Sidebar Mode */}
      {!inline && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl bg-itu-blue text-white hover:bg-blue-900 transition-all hover:scale-110 z-50 group border-2 border-white"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white text-xs font-bold items-center justify-center border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>
      )}
    </>
  );
}
