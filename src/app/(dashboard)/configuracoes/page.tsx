'use client';

import { useState } from 'react';
import { PersonaConfig } from '@/components/shared/persona-config';
import { Settings, Bot, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'empresa' | 'persona' | 'usuarios';

const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'persona', label: 'Persona IA', icon: Bot },
    { id: 'usuarios', label: 'Usuários', icon: Users },
];

export default function ConfiguracoesPage() {
    const [activeTab, setActiveTab] = useState<TabId>('persona');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Configurações</h1>
                <p className="text-sm text-slate-400 mt-1">Personalize seu TriaGO</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 rounded-lg p-1 max-w-md">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
                            activeTab === tab.id
                                ? 'bg-slate-800 text-white shadow-sm'
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
                <div className="space-y-5 max-w-lg animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Nome da empresa</label>
                        <input
                            type="text" defaultValue="Minha Empresa"
                            className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Fuso horário</label>
                        <select className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                            <option>America/Sao_Paulo (GMT-3)</option>
                            <option>America/Fortaleza (GMT-3)</option>
                            <option>America/Manaus (GMT-4)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Horário de atendimento</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="time" defaultValue="08:00" className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                            <input type="time" defaultValue="18:00" className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                        </div>
                    </div>
                    <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer">
                        Salvar alterações
                    </button>
                </div>
            )}

            {activeTab === 'persona' && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Personalidade do Agente IA</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Defina como o agente se comunica com seus clientes</p>
                            </div>
                        </div>
                        <PersonaConfig />
                        <div className="mt-6 pt-4 border-t border-slate-800">
                            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer">
                                Salvar persona
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'usuarios' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                                U
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Usuário Admin</p>
                                <p className="text-xs text-slate-500">admin@empresa.com · Owner</p>
                            </div>
                        </div>
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                            + Convidar novo membro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
