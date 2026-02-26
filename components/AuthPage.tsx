import React, { useState } from 'react';
import { Layers, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, ShieldQuestion, KeyRound, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { register, login, getSecurityQuestion, resetPassword } from '../services/authService';
import { ContactForm } from './ContactForm';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

const SECURITY_QUESTIONS = [
    'What was the name of your first pet?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was the name of your first school?',
    'What is your favorite book?',
    'What was the make of your first car?',
    'What is your favorite movie?',
    'What street did you grow up on?',
];

interface AuthPageProps {
    onAuthSuccess: (user: { id: number; name: string; email: string; role: string }) => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'forgot-answer';

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<AuthMode>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showContactForm, setShowContactForm] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [securityAnswer, setSecurityAnswer] = useState('');

    // Forgot password fields
    const [forgotEmail, setForgotEmail] = useState('');
    const [fetchedQuestion, setFetchedQuestion] = useState('');
    const [forgotAnswer, setForgotAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');

    const resetFields = () => {
        setError('');
        setSuccess('');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSecurityQuestion(SECURITY_QUESTIONS[0]);
        setSecurityAnswer('');
        setForgotEmail('');
        setFetchedQuestion('');
        setForgotAnswer('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTurnstileToken('');
    };

    const switchMode = (m: AuthMode) => {
        resetFields();
        setMode(m);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!turnstileToken) {
            setError(t('auth.errorCaptcha'));
            return;
        }
        setLoading(true);
        try {
            const data = await login(email, password, turnstileToken);
            onAuthSuccess(data.user);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!turnstileToken) {
            setError(t('auth.errorCaptcha'));
            return;
        }
        setLoading(true);
        try {
            if (password !== confirmPassword) {
                setError(t('auth.errorPasswordMatch'));
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError(t('auth.errorPasswordLength'));
                setLoading(false);
                return;
            }
            if (!securityAnswer.trim()) {
                setError(t('auth.errorSecurityAnswer'));
                setLoading(false);
                return;
            }
            const data = await register(name, email, password, securityQuestion, securityAnswer, turnstileToken);
            onAuthSuccess(data.user);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!turnstileToken) {
            setError(t('auth.errorCaptcha'));
            return;
        }
        setLoading(true);
        try {
            const data = await getSecurityQuestion(forgotEmail, turnstileToken);
            setFetchedQuestion(data.securityQuestion);
            setTurnstileToken('');
            setMode('forgot-answer');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!turnstileToken) {
            setError(t('auth.errorCaptcha'));
            return;
        }
        setLoading(true);
        try {
            if (newPassword !== confirmNewPassword) {
                setError(t('auth.errorPasswordMatch'));
                setLoading(false);
                return;
            }
            if (newPassword.length < 6) {
                setError(t('auth.errorPasswordLength'));
                setLoading(false);
                return;
            }
            await resetPassword(forgotEmail, forgotAnswer, newPassword, turnstileToken);
            setSuccess(t('auth.successReset'));
            setTimeout(() => switchMode('login'), 2000);
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/[0.07] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 relative">
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher variant="header" />
            </div>

            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
            </div>

            {/* Logo */}
            <div className="flex items-center space-x-3 mb-8 relative z-10">
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-3 rounded-2xl shadow-lg shadow-cyan-500/20">
                    <Layers className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{t('auth.title')}</h1>
                    <p className="text-xs text-slate-400">{t('auth.subtitle')}</p>
                </div>
            </div>

            {/* Auth Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">

                    {/* Tab Switcher (only for login/register) */}
                    {(mode === 'login' || mode === 'register') && (
                        <div className="flex border-b border-white/10">
                            <button
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-all ${mode === 'login'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5'
                                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
                                    }`}
                            >
                                {t('auth.signIn')}
                            </button>
                            <button
                                onClick={() => switchMode('register')}
                                className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-all ${mode === 'register'
                                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5'
                                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
                                    }`}
                            >
                                {t('auth.register')}
                            </button>
                        </div>
                    )}

                    {/* Forgot Password Header */}
                    {(mode === 'forgot' || mode === 'forgot-answer') && (
                        <div className="flex items-center border-b border-white/10 px-6 py-4">
                            <button onClick={() => switchMode('login')} className="text-slate-400 hover:text-white mr-3 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-sm font-semibold text-white tracking-wide">{t('auth.resetPasswordTitle')}</h2>
                        </div>
                    )}

                    {/* Error & Success */}
                    <div className="px-8 pt-6">
                        {error && (
                            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm mb-4">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-sm mb-4">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                    </div>

                    {/* ═══ LOGIN FORM ═══ */}
                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-5">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
                            </div>

                            <div className="flex justify-center scale-95 origin-center mt-2 mb-2">
                                <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{t('auth.signIn')}</span><ArrowRight className="w-4 h-4" /></>}
                            </button>

                            <button type="button" onClick={() => switchMode('forgot')} className="w-full text-center text-xs text-slate-400 hover:text-cyan-400 transition-colors pt-1">
                                {t('auth.forgotPassword')}
                            </button>
                        </form>
                    )}

                    {/* ═══ REGISTER FORM ═══ */}
                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="px-8 pb-8 space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="text" placeholder={t('auth.fullName')} value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder={t('auth.confirmPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
                            </div>

                            {/* Security Question */}
                            <div className="border-t border-white/10 pt-4 mt-2">
                                <p className="text-xs text-slate-400 mb-3 flex items-center">
                                    <ShieldQuestion className="w-4 h-4 mr-1.5 text-cyan-400" />
                                    {t('auth.securityQuestionDesc')}
                                </p>
                                <select
                                    value={securityQuestion}
                                    onChange={(e) => setSecurityQuestion(e.target.value)}
                                    className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all mb-3 appearance-none"
                                >
                                    {SECURITY_QUESTIONS.map((q, idx) => {
                                        const keys = ['sq_pet', 'sq_city', 'sq_mother', 'sq_school', 'sq_book', 'sq_car', 'sq_movie', 'sq_street'];
                                        return <option key={q} value={q} className="bg-slate-800 text-white">{t(`auth.${keys[idx]}`)}</option>
                                    })}
                                </select>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input type="text" placeholder={t('auth.yourAnswer')} value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required className={inputClass} />
                                </div>
                            </div>

                            <div className="flex justify-center scale-95 origin-center mt-2 mb-2">
                                <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{t('auth.createAccount')}</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ═══ FORGOT STEP 1: Enter Email ═══ */}
                    {mode === 'forgot' && (
                        <form onSubmit={handleForgotStep1} className="px-8 pb-8 space-y-5">
                            <p className="text-sm text-slate-400">{t('auth.enterEmailForgot')}</p>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" placeholder={t('auth.email')} value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="flex justify-center scale-95 origin-center mt-2 mb-2">
                                <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{t('auth.continue')}</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ═══ FORGOT STEP 2: Answer + New Password ═══ */}
                    {mode === 'forgot-answer' && (
                        <form onSubmit={handleForgotStep2} className="px-8 pb-8 space-y-4">
                            <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
                                <p className="text-xs text-slate-400 mb-1">{t('auth.yourSecurityQuestion')}</p>
                                <p className="text-sm text-cyan-300 font-medium">
                                    {/* Map English text coming from backend to translated question */}
                                    {(() => {
                                        const idx = SECURITY_QUESTIONS.indexOf(fetchedQuestion);
                                        if (idx !== -1) {
                                            const keys = ['sq_pet', 'sq_city', 'sq_mother', 'sq_school', 'sq_book', 'sq_car', 'sq_movie', 'sq_street'];
                                            return t(`auth.${keys[idx]}`);
                                        }
                                        return fetchedQuestion;
                                    })()}
                                </p>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="text" placeholder={t('auth.yourAnswer')} value={forgotAnswer} onChange={(e) => setForgotAnswer(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder={t('auth.newPassword')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" placeholder={t('auth.confirmNewPassword')} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className={inputClass} />
                            </div>
                            <div className="flex justify-center scale-95 origin-center mt-2 mb-2">
                                <Turnstile siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3.5 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{t('auth.resetPasswordBtn')}</span><ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center mt-6 space-y-3 relative z-10">
                    <button
                        onClick={() => setShowContactForm(true)}
                        className="flex items-center space-x-1.5 px-4 py-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>{t('auth.sendFeedback')}</span>
                    </button>
                    <a
                        href="https://polen.itu.edu.tr/entities/publication/885d18fb-c6c0-4d0e-87d6-bd36b1781937"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-md hover:bg-blue-600/30 transition-colors text-sm font-medium shadow-sm"
                    >
                        Learning Station Design Guide
                    </a>
                    <p className="text-center text-slate-500 text-xs">
                        &copy; {new Date().getFullYear()} {t('auth.footerText')}
                    </p>
                </div>
            </div>

            {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} userName={name} userEmail={email} />}
        </div>
    );
};
