import { useState, useEffect } from 'react';
import { GitBranch, ArrowRight, ShieldAlert, Bot, Settings, Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sector, OrganizationSettings, AIPersona } from '@/types';

export default function FluxoPage() {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [aiSettings, setAiSettings] = useState<OrganizationSettings | null>(null);
    const [activePersona, setActivePersona] = useState<AIPersona | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // AI Edit Drawer state
    const [showAiDrawer, setShowAiDrawer] = useState(false);
    const [drawerPersonaName, setDrawerPersonaName] = useState('');
    const [drawerPersonaDesc, setDrawerPersonaDesc] = useState('');
    const [drawerPersonaInst, setDrawerPersonaInst] = useState('');
    const [drawerPromptBase, setDrawerPromptBase] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sectors
                const resSectors = await fetch('/api/sectors');
                const dataSectors = await resSectors.json();

                // Fetch AI settings
                const resAi = await fetch('/api/ai-settings');
                const dataAi = await resAi.json();

                if (resSectors.ok && resAi.ok) {
                    setSectors(dataSectors.sectors || []);
                    setAiSettings(dataAi.settings || null);
                    setActivePersona(dataAi.persona || null);
                }
            } catch (error) {
                console.error('Failed to load routing config', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenAiDrawer = () => {
        setDrawerPersonaName(activePersona?.name || '');
        setDrawerPersonaDesc(activePersona?.description || '');
        setDrawerPersonaInst(activePersona?.prompt_instructions || '');
        setDrawerPromptBase(aiSettings?.custom_prompt_base || '');
        setShowAiDrawer(true);
    };

    const handleSaveAiSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/ai-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    persona_name: drawerPersonaName,
                    persona_description: drawerPersonaDesc,
                    persona_instructions: drawerPersonaInst,
                    custom_prompt_base: drawerPromptBase
                })
            });
            if (res.ok) {
                setActivePersona(prev => prev ? { ...prev, name: drawerPersonaName, description: drawerPersonaDesc, prompt_instructions: drawerPersonaInst } : null);
                setAiSettings(prev => prev ? { ...prev, custom_prompt_base: drawerPromptBase } : null);
                setShowAiDrawer(false);
            }
        } catch (error) {
            console.error('Failed to save AI config', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const regularSectors = sectors.filter(s => !s.is_fallback);
    const fallbackSector = sectors.find(s => s.is_fallback);
    const totalKeywords = regularSectors.reduce((acc, s) => acc + (s.keywords?.length || 0), 0);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Visualizador de Roteamento</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Motor de Atribuição: Palavras-chave vs Inteligência Artificial
                    </p>
                </div>
                <button
                    onClick={handleOpenAiDrawer}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                >
                    <Settings className="w-4 h-4" />
                    Configurar IA (Persona)
                </button>
            </div>

            {/* Visual Flow */}
            <div className="space-y-4">
                {/* Entry point */}
                <div className="flex items-center gap-3 py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <GitBranch className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Mensagem Recebida do Canal WhatsApp</p>
                        <p className="text-xs text-zinc-500">A mensagem entra no Pipeline de Avaliação</p>
                    </div>
                </div>

                <div className="flex justify-center"><div className="w-px h-6 bg-zinc-700" /></div>

                {/* --- LAYER 1: KEYWORDS --- */}
                <div className="p-5 border border-zinc-800 bg-zinc-900/50 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-zinc-400 text-[11px] mb-2">Camada 1: Correspondência Exata (Palavras-Chave)</h2>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{totalKeywords} Gatilhos Ativos</span>
                    </div>

                    <div className="space-y-3">
                        {regularSectors.map((sector) => (
                            <div key={sector.id} className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xl">{sector.icon || '📁'}</span>
                                    <h3 className="font-semibold text-white text-sm">Se para: {sector.name}</h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(sector.keywords || []).length > 0 ? sector.keywords!.map((kw) => (
                                        <span key={kw} className="px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 rounded-md">
                                            {kw}
                                        </span>
                                    )) : <span className="text-xs text-zinc-500">Sem palavras-chave definidas</span>}
                                </div>
                                <div className="flex items-start gap-2 pt-2 border-t border-indigo-500/10">
                                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-zinc-400">Resposta automática: "{sector.response_template || 'Nenhuma'}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center"><div className="w-px h-6 bg-zinc-700" /></div>

                {/* --- LAYER 2: AI ROUTER --- */}
                <div className="p-5 border border-purple-500/20 bg-purple-500/5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Bot className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Bot className="w-5 h-5 text-purple-400" />
                            <h2 className="text-sm font-semibold text-white">Camada 2: Inteligência Artificial (Triagem por Intenção)</h2>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4 max-w-2xl">
                            Se a mensagem não contiver as palavras-chave acima, a IA assumirá o controle.
                            Ela tentará identificar a intenção do cliente, interagir seguindo a Persona configurada,
                            e após entender, encaminhará ao setor correto.
                        </p>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-md">
                            <p className="text-[10px] font-medium text-purple-400 uppercase tracking-wider mb-2">Persona Ativa</p>
                            <h3 className="text-white font-medium text-sm">{activePersona?.name || 'Assistente Padrão'}</h3>
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{activePersona?.description || 'Nenhuma descrição fornecida'}</p>
                            <div className="mt-3 pt-3 border-t border-zinc-800">
                                <p className="text-[10px] font-medium text-purple-400 uppercase tracking-wider mb-1">Contexto Global (Empresa)</p>
                                <p className="text-xs text-zinc-400 line-clamp-2 italic">"{aiSettings?.custom_prompt_base || 'Sem contexto adicional configurado'}"</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center"><div className="w-px h-6 bg-zinc-700" /></div>

                {/* Fallback */}
                {fallbackSector && (
                    <div className="flex items-center gap-3 py-3 px-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-300">Setor de Fallback ({fallbackSector.name})</p>
                            <p className="text-xs text-zinc-500">Para onde vão as conversas não classificadas ou com erro na IA</p>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Config Drawer */}
            {showAiDrawer && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 animate-in fade-in" onClick={() => setShowAiDrawer(false)} />
                    <div className="fixed right-0 top-0 h-screen w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-semibold text-white">Configurar IA Responsiva</h2>
                            </div>
                            <button onClick={() => setShowAiDrawer(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-white mb-4">Informações da Persona</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Nome do Arquétipo</label>
                                        <input
                                            value={drawerPersonaName} onChange={e => setDrawerPersonaName(e.target.value)}
                                            placeholder="Ex: Vendedor Agressivo"
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Descrição do Perfil</label>
                                        <input
                                            value={drawerPersonaDesc} onChange={e => setDrawerPersonaDesc(e.target.value)}
                                            placeholder="Ex: Consultor Sênior especializado em vendas B2B..."
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-400 mb-1 block">Instruções Comportamentais Restritas (Como deve falar?)</label>
                                        <textarea
                                            value={drawerPersonaInst} onChange={e => setDrawerPersonaInst(e.target.value)}
                                            rows={4}
                                            placeholder="Ex: Nunca ofereça descontos. Use tom de autoridade. Sempre pergunte o cargo da pessoa."
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-800 pt-6">
                                <h3 className="text-sm font-medium text-white mb-4">Contexto Global (Prompt Base da Empresa)</h3>
                                <div>
                                    <label className="text-xs text-zinc-400 mb-1 block">Informações que a IA deve saber</label>
                                    <textarea
                                        value={drawerPromptBase} onChange={e => setDrawerPromptBase(e.target.value)}
                                        rows={4}
                                        placeholder="Ex: Somos a empresa TrackerAi. Vendemos software online. Nosso horário de atendimento é das 8h às 18h..."
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">Este contexto é injetado junto com as informações da Persona quando o WhatsApp envia a mensagem para a IA avaliar.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-zinc-800 bg-zinc-950 flex gap-3">
                            <button onClick={() => setShowAiDrawer(false)} className="flex-1 py-2 rounded-lg bg-zinc-800 text-sm text-white font-medium hover:bg-zinc-700">Cancelar</button>
                            <button
                                onClick={handleSaveAiSettings} disabled={isSaving}
                                className="flex-1 py-2 rounded-lg bg-indigo-600 text-sm text-white font-medium hover:bg-indigo-500 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar IA
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
