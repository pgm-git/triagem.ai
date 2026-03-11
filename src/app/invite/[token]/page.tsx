'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Mail, Lock, User, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { use } from 'react';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<any>(null);

    const [form, setForm] = useState({
        fullName: '',
        password: '',
    });

    useEffect(() => {
        const checkInvite = async () => {
            try {
                const res = await fetch(`/api/team/invite/${resolvedParams.token}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Convite inválido ou expirado.');
                    return;
                }

                setInviteData(data.invite);
            } catch (err) {
                setError('Erro de conexão ao verificar o convite.');
            } finally {
                setLoading(false);
            }
        };

        checkInvite();
    }, [resolvedParams.token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const supabase = createClient();

            // Register the user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: inviteData.email,
                password: form.password,
                options: {
                    data: {
                        full_name: form.fullName,
                        invite_token: inviteData.token,
                        organization_id: inviteData.organization_id,
                        role: inviteData.role,
                    }
                }
            });

            if (signUpError) {
                // If user already exists, they might need to just log in or reset password.
                if (signUpError.message.includes('already registered')) {
                    throw new Error('Este e-mail já possui cadastro. Faça login normalmente.');
                }
                throw signUpError;
            }

            toast.success('Conta criada com sucesso!');
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Falha ao criar conta.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Convite Indisponível</h1>
                <p className="text-slate-400 text-center max-w-sm mb-8">{error}</p>
                <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl hover:bg-slate-800 transition-all font-medium"
                >
                    Voltar para o Login
                </button>
            </div>
        );
    }

    const orgName = inviteData?.organizations?.name || 'sua nova empresa';

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white text-center">
                        Você foi convidado!
                    </h1>
                    <p className="text-slate-400 text-center mt-2">
                        Junte-se ao time da <span className="text-blue-400 font-medium">{orgName}</span> no TriaGO.
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400">E-mail Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    disabled
                                    value={inviteData.email}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 opacity-70 cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Carlos Silva"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-400">Crie uma Senha Segura</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Mínimo 6 caracteres"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-500/25 flex items-center justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Criar Minha Conta'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
