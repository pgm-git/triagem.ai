'use client';

import { useState, useEffect } from 'react';
import { PersonaConfig } from '@/components/shared/persona-config';
import {
    Settings, Bot, Users, Building2, HelpCircle,
    Save, Loader2, Info, Sparkles,
    ChevronRight, MessageSquareMore
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { toast } from 'sonner';

type TabId = 'empresa' | 'persona' | 'usuarios' | 'ajuda';

const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'persona', label: 'Persona IA', icon: Bot },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'ajuda', label: 'Ajuda & Guia', icon: HelpCircle },
];

export default function ConfiguracoesPage() {
    const { organization, profile, refreshOrganization } = useUser();
    const [activeTab, setActiveTab] = useState<TabId>('empresa');
    const [saving, setSaving] = useState(false);

    const [orgForm, setOrgForm] = useState({
        name: '',
        primary_color: '#3b82f6',
        sidebar_color: '#0f172a',
        logo_url: ''
    });

    useEffect(() => {
        if (organization) {
            setOrgForm({
                name: organization.name || '',
                primary_color: organization.primary_color || '#3b82f6',
                sidebar_color: organization.sidebar_color || '#0f172a',
                logo_url: organization.logo_url || ''
            });
        }
    }, [organization]);

    const handleSaveOrg = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/organizations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orgForm)
            });
            if (!res.ok) throw new Error('Falha ao salvar');

            await refreshOrganization();
            toast.success('Configurações salvas com sucesso!');
        } catch (err) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Configurações</h1>
                    <p className="text-sm text-slate-400 mt-1">Personalize a identidade e o comportamento do seu TriaGO</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer',
                            activeTab === tab.id
                                ? 'bg-blue-600/10 text-blue-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'empresa' && (
                <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Identidade da Marca</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Defina como sua empresa aparece para a equipe e no sistema</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={orgForm.name}
                                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">URL da Logomarca (PNG/SVG)</label>
                                <input
                                    type="text"
                                    value={orgForm.logo_url}
                                    onChange={(e) => setOrgForm({ ...orgForm, logo_url: e.target.value })}
                                    placeholder="https://sua-logo.com/logo.png"
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Cor Primária (Tema)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={orgForm.primary_color}
                                        onChange={(e) => setOrgForm({ ...orgForm, primary_color: e.target.value })}
                                        className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={orgForm.primary_color}
                                        onChange={(e) => setOrgForm({ ...orgForm, primary_color: e.target.value })}
                                        className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">Cor da Sidebar</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={orgForm.sidebar_color}
                                        onChange={(e) => setOrgForm({ ...orgForm, sidebar_color: e.target.value })}
                                        className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={orgForm.sidebar_color}
                                        onChange={(e) => setOrgForm({ ...orgForm, sidebar_color: e.target.value })}
                                        className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={handleSaveOrg}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Identidade
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3">
                        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-500/80 leading-relaxed">
                            <p className="font-bold mb-1">Nota sobre Customização:</p>
                            As cores selecionadas acima afetam os botões, links, destaques e a cor de fundo do menu lateral para todos os membros da sua empresa. Para melhores resultados no modo escuro, utilize cores de fundo da sidebar escuras.
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'persona' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Personalidade do Agente IA</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Defina como o agente se comunica com seus clientes</p>
                            </div>
                        </div>
                        <PersonaConfig />
                    </div>
                </div>
            )}

            {activeTab === 'usuarios' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Membros da Equipe</h3>
                                    <p className="text-xs text-slate-500">Gerencie acessos e perfis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.location.href = '/equipe'}
                                className="text-xs bg-blue-600/10 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-600/20 transition-all font-medium"
                            >
                                Ir para Equipe
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {profile?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-white">{profile?.full_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{profile?.role}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'ajuda' && (
                <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-8 bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border-b border-slate-800">
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <Sparkles className="w-7 h-7 text-blue-400" />
                                Bem-vindo ao TriaGO!
                            </h2>
                            <p className="text-slate-400">Preparamos este guia rápido para você configurar sua operação de atendimento em poucos minutos.</p>
                        </div>

                        <div className="p-8 space-y-12">
                            {/* Passo 1 */}
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-lg shadow-blue-600/30">1</div>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-white">Conecte o seu WhatsApp</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        O primeiro passo é conectar uma instância do WhatsApp. Vá na aba <span className="text-blue-400 font-medium">Canais</span> e escaneie o QR Code. Isso permitirá que a IA TriaGO receba e direcione os clientes.
                                    </p>
                                    <div className="pt-2">
                                        <button onClick={() => window.location.href = '/canais'} className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5">
                                            Ir para Canais <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Passo 2 */}
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0">2</div>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-white">Defina seus Setores (Filas)</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Explique para a IA quais são os departamentos da sua empresa (ex: Comercial, Suporte, Financeiro). Adicione palavras-chave ou deixe que a IA aprenda a intenção do cliente para rotear automaticamente.
                                    </p>
                                    <div className="pt-2">
                                        <button onClick={() => window.location.href = '/setores'} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5">
                                            Configurar Setores <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Passo 3 */}
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0">3</div>
                                <div className="space-y-3">
                                    <h3 className="text-lg font-bold text-white">Convide seus Atendentes</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Na aba <span className="text-emerald-400 font-medium">Equipe</span>, gere links de convite para seus vendedores ou agentes. Depois, associe cada membro aos setores que ele deve atender para que ele comece a receber clientes no Inbox.
                                    </p>
                                    <div className="pt-2">
                                        <button onClick={() => window.location.href = '/equipe'} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5">
                                            Gerenciar Equipe <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <MessageSquareMore className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Precisa de suporte personalizado?</p>
                                        <p className="text-xs text-slate-500">Nossa equipe está disponível para ajudar no onboarding.</p>
                                    </div>
                                </div>
                                <button className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all">
                                    Falar com Suporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
