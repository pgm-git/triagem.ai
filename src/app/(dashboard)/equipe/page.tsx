'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/user-context';
import { Loader2, Users, Save, CheckCircle2, ShieldAlert, UserPlus, Mail, Clock, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EquipePage() {
    const { profile } = useUser();
    const [members, setMembers] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [teamRes, sectorRes, invitesRes] = await Promise.all([
                    fetch('/api/team'),
                    fetch('/api/sectors'),
                    fetch('/api/team/invite')
                ]);

                if (teamRes.ok) {
                    const data = await teamRes.json();
                    setMembers(data.members || []);
                }
                if (sectorRes.ok) {
                    const data = await sectorRes.json();
                    setSectors(data.sectors || []);
                }
                if (invitesRes.ok) {
                    const data = await invitesRes.json();
                    setInvites(data.invites || []);
                }
            } catch (err) {
                console.error('Failed to load team data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleSector = (memberId: string, sectorId: string) => {
        setMembers(prev => prev.map(m => {
            if (m.id !== memberId) return m;
            const newSectors = m.sectors.includes(sectorId)
                ? m.sectors.filter((s: string) => s !== sectorId)
                : [...m.sectors, sectorId];
            return { ...m, sectors: newSectors };
        }));
    };

    const handleSave = async (memberId: string) => {
        setSaving(memberId);
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile_id: memberId,
                    sector_ids: member.sectors,
                })
            });
            if (!res.ok) throw new Error('Falha ao salvar');
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setSaving(null), 500);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || inviting) return;
        setInviting(true);

        try {
            const res = await fetch('/api/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail })
            });
            const data = await res.json();

            if (res.ok) {
                setInvites(prev => [data.invite, ...prev]);
                setIsInviteOpen(false);
                setInviteEmail('');
            } else {
                alert(`Erro: ${data.details || data.error || 'Falha ao convidar'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Falha na conexão com o servidor.');
        } finally {
            setInviting(false);
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Only allow admins or owners, etc. Wait, we'll just show it for now.
    // In a real app we'd restrict the 'Save' or the whole page.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Sua Equipe de Atendimento
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Gerencie os membros da sua organização e defina quais filas de atendimento (Setores) eles irão cuidar.
                    </p>
                </div>
                {profile?.role === 'admin' || profile?.role === 'owner' ? (
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
                        Convidar Membro
                    </button>
                ) : null}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/50">
                            <th className="px-6 py-4 font-medium text-slate-400">Agente</th>
                            <th className="px-6 py-4 font-medium text-slate-400">E-mail</th>
                            <th className="px-6 py-4 font-medium text-slate-400">Acesso a Setores / Filas</th>
                            <th className="px-6 py-4 font-medium text-slate-400 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div className="font-medium text-slate-200">
                                            {member.full_name || 'Sem Nome'}
                                            {member.role === 'admin' && (
                                                <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {member.email}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {sectors.filter(s => s.is_active && !s.is_fallback).map(sector => {
                                            const isSelected = member.sectors.includes(sector.id);
                                            return (
                                                <button
                                                    key={sector.id}
                                                    onClick={() => toggleSector(member.id, sector.id)}
                                                    className={cn(
                                                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                                                        isSelected
                                                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                                                            : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                                                    )}
                                                >
                                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                                    {sector.icon} {sector.name}
                                                </button>
                                            );
                                        })}
                                        {sectors.filter(s => s.is_active && !s.is_fallback).length === 0 && (
                                            <span className="text-slate-500 text-xs italic">Nenhum setor ativo encontrado.</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleSave(member.id)}
                                        disabled={saving === member.id}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {saving === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Salvar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {invites.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                        <h2 className="text-sm font-semibold text-slate-200">Convites Pendentes</h2>
                    </div>
                    <table className="w-full text-left font-sans text-sm">
                        <tbody className="divide-y divide-slate-800/50">
                            {invites.map(invite => (
                                <tr key={invite.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">{invite.email}</div>
                                                <div className="text-xs text-slate-500">
                                                    Enviado em {new Date(invite.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => copyInviteLink(invite.token)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all"
                                        >
                                            {copiedToken === invite.token ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                            {copiedToken === invite.token ? 'Copiado!' : 'Copiar Link'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-lg max-w-2xl px-5 py-4 flex items-start gap-4">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-400">
                    <p className="font-medium text-slate-300 mb-1">Sobre a Fila de Espera</p>
                    Quando a IA Triadora (TriaGO) compreender a necessidade do cliente e designá-lo a um setor, o ticket cairá na aba "Fila de Espera" dos membros atrelados àquele respectivo Setor. Adicionar um membro à múltiplos setores fará com que este agente veja todas essas filas combinadas em seu Inbox.
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setIsInviteOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Convidar por E-mail</h2>
                                <p className="text-sm text-slate-400">Gere um link de acesso seguro atrelado à sua empresa</p>
                            </div>
                        </div>

                        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex gap-2">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <p>
                                <strong>Atenção:</strong> O sistema não envia o e-mail de forma automática nesta versão.
                                Após gerar o convite, você deve <strong>copiar o link</strong> gerado na tabela abaixo e enviá-lo pessoalmente (via WhatsApp/Email) ao seu vendedor.
                            </p>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">E-mail do Vendedor/Agente</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="agente@empresa.com"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={inviting || !inviteEmail}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
                            >
                                {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gerar Convite Seguro'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
