'use client';

import { useSetupStore } from '@/stores/setup';
import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

export function StepFallback() {
    const { data, updateData } = useSetupStore();
    const sectors = data.sectors?.filter((s) => s.is_active) || [];

    const [sectorId, setSectorId] = useState(data.fallback?.sectorId || '');
    const [message, setMessage] = useState(
        data.fallback?.message || 'Vou te encaminhar para um atendente. Aguarde um momento.'
    );

    useEffect(() => {
        if (sectorId && message) {
            updateData({ fallback: { sectorId, message } });
        }
    }, [sectorId, message]);

    // Auto-select first sector if none selected
    useEffect(() => {
        if (!sectorId && sectors.length > 0 && sectors[0].name) {
            setSectorId(sectors[0].name);
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Configure o fallback</h2>
                <p className="text-sm text-slate-400">
                    Quando a automação não entender a mensagem, o cliente será encaminhado para este setor
                </p>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/80">
                    O fallback é <strong>obrigatório</strong>. Ele garante que nenhuma conversa fique sem atendimento,
                    mesmo quando a automação não identifica a intenção do cliente.
                </p>
            </div>

            <div className="space-y-4">
                {/* Sector selector */}
                <div className="space-y-2">
                    <label htmlFor="fallback-sector" className="text-sm font-medium text-slate-300">
                        Setor de triagem
                    </label>
                    <select
                        id="fallback-sector"
                        value={sectorId}
                        onChange={(e) => setSectorId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-slate-900">Selecione um setor...</option>
                        {sectors.map((sector, i) => (
                            <option key={i} value={sector.name} className="bg-slate-900">
                                {sector.icon} {sector.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Fallback message */}
                <div className="space-y-2">
                    <label htmlFor="fallback-message" className="text-sm font-medium text-slate-300">
                        Mensagem padrão
                    </label>
                    <textarea
                        id="fallback-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Mensagem enviada ao cliente quando nenhuma regra é acionada"
                        className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                    />
                    <p className="text-xs text-slate-600">Esta mensagem será enviada automaticamente ao cliente.</p>
                </div>
            </div>
        </div>
    );
}
