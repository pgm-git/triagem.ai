'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    ArrowLeft,
    Loader2,
    Mail,
    MessageSquareMore,
} from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const supabase = createClient();
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setMessage('Se o email estiver cadastrado, você receberá um link de recuperação em instantes.');
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2">
                    <MessageSquareMore className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
                <p className="text-sm text-slate-400">Enviaremos um link de recuperação para o seu email</p>
            </div>

            {/* Card */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">
                {!message ? (
                    <form onSubmit={handleResetRequest} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-slate-300">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Enviar Link de Recuperação'
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <Mail className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {message}
                        </p>
                        <p className="text-xs text-slate-500">
                            Não esqueça de checar a sua pasta de spam.
                        </p>
                    </div>
                )}
            </div>

            {/* Back to login */}
            <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                </Link>
            </p>
        </div>
    );
}
