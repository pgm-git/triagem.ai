'use client';

import type { Sector, SectorTrigger, CollectionField } from '@/types';
import { useState, useEffect } from 'react';
import { X, Plus, Tag, Settings2, ClipboardList, Trash2, GripVertical, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorDrawerProps {
    open: boolean;
    sector: Partial<Sector> | null;
    onClose: () => void;
    onSave: (sector: Partial<Sector>) => void;
}

type TabId = 'dados' | 'gatilhos' | 'coleta';

export function SectorDrawer({ open, sector, onClose, onSave }: SectorDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabId>('dados');
    const [form, setForm] = useState<Partial<Sector>>({
        name: '',
        destination: '',
        icon: '📂',
        is_active: true,
        is_fallback: false,
        fallback_message: '',
        priority: 0,
        schedule_start: '',
        schedule_end: '',
        triggers: [],
        collection_fields: [],
    });

    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        if (sector) {
            setForm({ ...form, ...sector });
        } else {
            setForm({
                name: '', destination: '', icon: '📂', is_active: true,
                is_fallback: false, fallback_message: '', priority: 0,
                schedule_start: '', schedule_end: '',
                triggers: [{ keywords: [], response_template: '', type: 'keyword', is_active: true }],
                collection_fields: [],
            });
        }
        setActiveTab('dados');
        setNewKeyword('');
    }, [sector, open]);

    if (!open) return null;

    const isEdit = !!sector?.id;
    const trigger = form.triggers?.[0] || { keywords: [], response_template: '', type: 'keyword', is_active: true };

    const updateField = (field: string, value: string | boolean | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateTrigger = (updates: Partial<SectorTrigger>) => {
        const updated = { ...trigger, ...updates };
        setForm((prev) => ({ ...prev, triggers: [updated] }));
    };

    const addKeyword = () => {
        const kw = newKeyword.trim().toLowerCase();
        if (!kw || trigger.keywords.includes(kw)) return;
        updateTrigger({ keywords: [...trigger.keywords, kw] });
        setNewKeyword('');
    };

    const removeKeyword = (keyword: string) => {
        updateTrigger({ keywords: trigger.keywords.filter((k) => k !== keyword) });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addKeyword();
        }
    };

    const handleSubmit = () => {
        onSave(form);
    };

    // ── Collection fields helpers ────────────────
    const collectionFields = form.collection_fields || [];

    const addCollectionField = () => {
        const newField: CollectionField = {
            id: crypto.randomUUID(),
            variable: '',
            label: '',
            context: '',
            required: true,
        };
        setForm((prev) => ({ ...prev, collection_fields: [...(prev.collection_fields || []), newField] }));
    };

    const updateCollectionField = (id: string, updates: Partial<CollectionField>) => {
        setForm((prev) => ({
            ...prev,
            collection_fields: (prev.collection_fields || []).map((f) =>
                f.id === id ? { ...f, ...updates } : f
            ),
        }));
    };

    const removeCollectionField = (id: string) => {
        setForm((prev) => ({
            ...prev,
            collection_fields: (prev.collection_fields || []).filter((f) => f.id !== id),
        }));
    };

    const formatVariable = (value: string) => {
        return value
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30);
    };

    const tabs: { id: TabId; label: string; icon: typeof Settings2 }[] = [
        { id: 'dados', label: 'Dados', icon: Settings2 },
        { id: 'gatilhos', label: 'Gatilhos', icon: Tag },
        { id: 'coleta', label: 'Coleta', icon: ClipboardList },
    ];

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-200" onClick={onClose} />

            <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-5 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">
                            {isEdit ? 'Editar Setor' : 'Novo Setor'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
                                    activeTab === tab.id
                                        ? 'bg-zinc-800 text-white shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                                {tab.id === 'gatilhos' && trigger.keywords.length > 0 && (
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                                        {trigger.keywords.length}
                                    </span>
                                )}
                                {tab.id === 'coleta' && collectionFields.length > 0 && (
                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                        {collectionFields.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === 'dados' ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Nome do setor</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="Ex: Financeiro"
                                    required
                                    className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Destino</label>
                                <input
                                    type="text"
                                    value={form.destination || ''}
                                    onChange={(e) => updateField('destination', e.target.value)}
                                    placeholder="WhatsApp, email ou link"
                                    required
                                    className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Ícone</label>
                                    <input
                                        type="text"
                                        value={form.icon || ''}
                                        onChange={(e) => updateField('icon', e.target.value)}
                                        placeholder="Emoji"
                                        className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Prioridade</label>
                                    <input
                                        type="number"
                                        value={form.priority ?? 0}
                                        onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
                                        min={0} max={99}
                                        className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Horário início</label>
                                    <input
                                        type="time"
                                        value={form.schedule_start || ''}
                                        onChange={(e) => updateField('schedule_start', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Horário fim</label>
                                    <input
                                        type="time"
                                        value={form.schedule_end || ''}
                                        onChange={(e) => updateField('schedule_end', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <label className="text-sm font-medium text-zinc-300">Setor de fallback</label>
                                <button
                                    type="button"
                                    onClick={() => updateField('is_fallback', !form.is_fallback)}
                                    className={cn(
                                        'w-10 h-6 rounded-full flex items-center px-0.5 transition-all cursor-pointer',
                                        form.is_fallback ? 'bg-amber-500 justify-end' : 'bg-zinc-700 justify-start'
                                    )}
                                >
                                    <div className="w-5 h-5 bg-white rounded-full shadow transition-all" />
                                </button>
                            </div>

                            {form.is_fallback && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="text-sm font-medium text-zinc-300">Mensagem de fallback</label>
                                    <textarea
                                        value={form.fallback_message || ''}
                                        onChange={(e) => updateField('fallback_message', e.target.value)}
                                        rows={2}
                                        placeholder="Mensagem quando nenhuma regra se aplica"
                                        className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'gatilhos' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Keywords */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-zinc-300">Palavras-chave</label>
                                    <span className="text-[10px] text-zinc-600">
                                        {trigger.keywords.length} gatilho{trigger.keywords.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Keyword pills */}
                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {trigger.keywords.map((kw, i) => (
                                        <span
                                            key={kw}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-medium animate-in zoom-in-75 duration-200"
                                            style={{ animationDelay: `${i * 30}ms` }}
                                        >
                                            {kw}
                                            <button
                                                onClick={() => removeKeyword(kw)}
                                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-indigo-500/30 transition-colors cursor-pointer"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {trigger.keywords.length === 0 && (
                                        <p className="text-xs text-zinc-600 italic">Nenhuma palavra-chave adicionada</p>
                                    )}
                                </div>

                                {/* Add keyword input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Adicionar palavra-chave..."
                                        className="flex-1 px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                    />
                                    <button
                                        onClick={addKeyword}
                                        disabled={!newKeyword.trim()}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 transition-all cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-[10px] text-zinc-600">
                                    Pressione Enter ou clique + para adicionar. Mensagens contendo essas palavras serão encaminhadas para este setor.
                                </p>
                            </div>

                            {/* Response template */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Mensagem de confirmação</label>
                                <textarea
                                    value={trigger.response_template}
                                    onChange={(e) => updateTrigger({ response_template: e.target.value })}
                                    rows={3}
                                    placeholder="Mensagem enviada ao cliente quando redirecionado para este setor"
                                    className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            {/* Preview */}
                            {trigger.keywords.length > 0 && trigger.response_template && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preview</label>
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                                        <div className="flex justify-start">
                                            <div className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-2xl rounded-bl-md text-sm max-w-[80%]">
                                                Quero saber sobre {trigger.keywords[0]}
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="bg-indigo-600 text-white px-3 py-2 rounded-2xl rounded-br-md text-sm max-w-[80%]">
                                                {trigger.response_template}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Coleta Tab ─────────────── */
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                            {/* Info banner */}
                            <div className="flex items-start gap-3 p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-200/70">
                                    Campos que o agente IA deve coletar <strong>antes</strong> de transferir o cliente para este setor.
                                    Adicione variável, rótulo amigável e contexto para orientar a coleta.
                                </p>
                            </div>

                            {/* Fields list */}
                            {collectionFields.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
                                        <ClipboardList className="w-6 h-6 text-zinc-600" />
                                    </div>
                                    <p className="text-sm text-zinc-400">Nenhum campo configurado</p>
                                    <p className="text-xs text-zinc-600 mt-1">Campos de coleta são opcionais</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {collectionFields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-3.5 h-3.5 text-zinc-600" />
                                                    <span className="text-xs font-mono text-zinc-500">#{index + 1}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCollectionField(field.id, { required: !field.required })}
                                                        className={cn(
                                                            'px-2 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer',
                                                            field.required
                                                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                                        )}
                                                    >
                                                        {field.required ? 'Obrigatório' : 'Opcional'}
                                                    </button>
                                                    <button
                                                        onClick={() => removeCollectionField(field.id)}
                                                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Variável</label>
                                                    <input
                                                        type="text"
                                                        value={field.variable}
                                                        onChange={(e) => updateCollectionField(field.id, { variable: formatVariable(e.target.value) })}
                                                        placeholder="ex: placa"
                                                        className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Rótulo</label>
                                                    <input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) => updateCollectionField(field.id, { label: e.target.value })}
                                                        placeholder="ex: Placa do veículo"
                                                        className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Contexto para o agente IA</label>
                                                <textarea
                                                    value={field.context}
                                                    onChange={(e) => updateCollectionField(field.id, { context: e.target.value })}
                                                    rows={2}
                                                    placeholder="Explique o que o agente precisa coletar. Ex: Placa no formato ABC-1234 ou ABC1D23"
                                                    className="w-full px-2.5 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add button */}
                            <button
                                onClick={addCollectionField}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar campo
                            </button>

                            {collectionFields.length > 0 && (
                                <p className="text-center text-[10px] text-zinc-600">
                                    {collectionFields.filter((f) => f.required).length} obrigatório{collectionFields.filter((f) => f.required).length !== 1 ? 's' : ''} · {collectionFields.filter((f) => !f.required).length} opcion{collectionFields.filter((f) => !f.required).length !== 1 ? 'ais' : 'al'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-zinc-800 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all cursor-pointer"
                    >
                        {isEdit ? 'Salvar' : 'Criar setor'}
                    </button>
                </div>
            </div>
        </>
    );
}
