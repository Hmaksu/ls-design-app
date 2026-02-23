import React, { useState } from 'react';
import { Send, X, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { Turnstile } from '@marsidev/react-turnstile';

interface ContactFormProps {
    onClose: () => void;
    userName?: string;
    userEmail?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onClose, userName, userEmail }) => {
    const [name, setName] = useState(userName || '');
    const [email, setEmail] = useState(userEmail || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !message.trim()) return;
        if (!turnstileToken) {
            setErrorMsg('Please complete the CAPTCHA');
            setStatus('error');
            return;
        }

        setSending(true);
        setStatus('idle');
        setErrorMsg('');

        try {
            // Replace these with your actual EmailJS credentials
            const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'dummy_service';
            const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'dummy_template';
            const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'dummy_public_key';

            const templateParams = {
                from_name: name.trim(),
                from_email: email.trim(),
                subject: subject.trim(),
                message: message.trim(),
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

            // Also save to database
            await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim(), turnstileToken }),
            });

            setStatus('success');
            setSubject('');
            setMessage('');
            setTurnstileToken('');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err?.text || err.message || 'Error connecting to email service');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                    <h3 className="text-lg font-bold text-white flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Contact / Feedback
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h4 className="text-xl font-bold text-slate-800 mb-2">Thank You!</h4>
                            <p className="text-slate-500 mb-6">Your feedback has been sent successfully.</p>
                            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="What's this about?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    rows={5}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Your feedback, suggestions, or bug reports..."
                                />
                            </div>

                            {status === 'error' && (
                                <p className="text-sm text-red-500 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" /> {errorMsg}
                                </p>
                            )}

                            <div className="flex justify-center scale-95 origin-center my-2">
                                <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !name.trim() || !email.trim() || !message.trim()}
                                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                            >
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" /> Send Feedback</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
