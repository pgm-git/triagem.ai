'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    MessageSquareMore,
} from 'lucide-react';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
            },
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                setError('Este email já está cadastrado.');
            } else {
                setError(authError.message);
            }
            setLoading(false);
            return;
        }

        router.push('/dashboard');
        router.refresh();
    };

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2">
                    <MessageSquareMore className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
                <p className="text-sm text-slate-400">Configure seu TriaGO em minutos</p>
            </div>

            {/* Card */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="fullName" className="text-sm font-medium text-slate-300">
                            Nome completo
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome"
                            required
                            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                        />
                    </div>

                    {/* Email */}
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

                    {/* Password */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-slate-300">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg transition-all text-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Criar conta
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-slate-500">
                Já tem conta?{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Fazer login
                </Link>
            </p>
        </div>
    );
}
