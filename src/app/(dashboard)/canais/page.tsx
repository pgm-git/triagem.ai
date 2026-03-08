'use client';

import { useState } from 'react';
import {
    Smartphone,
    Wifi,
    WifiOff,
    RefreshCw,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    QrCode,
    Shield,
    Zap,
    AlertTriangle,
    ArrowRight,
    Loader2,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WhatsAppInstance, WhatsAppProvider } from '@/types';

// ── Demo data ─────────────────────────────────
const demoInstances: WhatsAppInstance[] = [
    {
        id: 'inst-1',
        organization_id: 'org-1',
        instance_name: 'Atendimento Principal',
        provider: 'uazapi',
        uazapi_url: 'https://demo.uazapi.com',
        phone_number: '+55 11 99999-0001',
        status: 'connected',
        webhook_secret: 'ws-123',
        last_connected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// ── Status config ──────────────────────────────
const statusConfig = {
    connected: { label: 'Conectado', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
    disconnected: { label: 'Desconectado', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
    qr_pending: { label: 'QR Pendente', icon: QrCode, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
    connecting: { label: 'Conectando...', icon: Clock, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
};

// ── Provider cards data ────────────────────────
const providerInfo: Record<WhatsAppProvider, {
    name: string;
    description: string;
    icon: string;
    color: string;
    borderColor: string;
    pros: string[];
    cons: string[];
}> = {
    uazapi: {
        name: 'UazAPI',
        description: 'API não-oficial via QR Code',
        icon: '⚡',
        color: 'bg-amber-500/10 text-amber-400',
        borderColor: 'border-amber-500/30 hover:border-amber-500/50',
        pros: [
            'Setup em 30 segundos via QR Code',
            'Sem custos por mensagem',
            'Sem verificação de empresa',
            'Grupos, status, reações',
        ],
        cons: [
            'Pode cair e precisar reconectar',
            'Risco de ban pela Meta',
            'Depende de servidor UazAPI',
        ],
    },
    meta_cloud: {
        name: 'Meta Cloud API',
        description: 'API oficial do WhatsApp Business',
        icon: '🛡️',
        color: 'bg-blue-500/10 text-blue-400',
        borderColor: 'border-blue-500/30 hover:border-blue-500/50',
        pros: [
            'Estabilidade 99.9%, sem risco de ban',
            'Suporte oficial da Meta',
            'Templates e botões interativos',
            'Sem limite em conversas de serviço',
        ],
        cons: [
            'Requer verificação de empresa (CNPJ)',
            'Setup leva dias/semanas',
            'Custo por conversa de marketing',
        ],
    },
};

export default function CanaisPage() {
    const [instances, setInstances] = useState<WhatsAppInstance[]>(demoInstances);
    const [showNewDrawer, setShowNewDrawer] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<WhatsAppProvider | null>(null);
    const [connectStep, setConnectStep] = useState<'select' | 'form' | 'connecting'>('select');

    // ── Form state ────────────────────────────
    const [formName, setFormName] = useState('');
    // Meta
    const [metaAccessToken, setMetaAccessToken] = useState('');
    const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
    const [metaBusinessId, setMetaBusinessId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDrawer = () => {
        setShowNewDrawer(true);
        setSelectedProvider(null);
        setConnectStep('select');
        setFormName('');
        setMetaAccessToken('');
        setMetaPhoneNumberId('');
        setMetaBusinessId('');
    };

    const selectProvider = (provider: WhatsAppProvider) => {
        setSelectedProvider(provider);
        setConnectStep('form');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setConnectStep('connecting');

        try {
            const payload: Record<string, string> = {
                provider: selectedProvider!,
                instance_name: formName || (selectedProvider === 'uazapi' ? 'Atendimento' : 'WhatsApp Business'),
            };

            if (selectedProvider === 'meta_cloud') {
                payload.access_token = metaAccessToken;
                payload.phone_number_id = metaPhoneNumberId;
                payload.business_account_id = metaBusinessId;
            }

            const res = await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                console.error('Create error:', data.error);
                // TODO: show error toast
            } else {
                const inst = data.instance;
                setInstances((prev) => [...prev, {
                    id: inst.id,
                    organization_id: 'org-1',
                    instance_name: inst.instance_name,
                    provider: inst.provider,
                    phone_number: inst.phone_number,
                    status: inst.status,
                    webhook_secret: '',
                    created_at: inst.created_at,
                    updated_at: inst.created_at,
                }]);
            }
        } catch (err) {
            console.error('Create failed:', err);
        }

        setIsSubmitting(false);
        setShowNewDrawer(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Canais WhatsApp</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {instances.filter((i) => i.status === 'connected').length} conectado{instances.filter((i) => i.status === 'connected').length !== 1 ? 's' : ''} · {instances.length} instância{instances.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={openDrawer}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Nova Conexão
                </button>
            </div>

            {/* Instance Cards */}
            <div className="space-y-4">
                {instances.map((instance) => {
                    const cfg = statusConfig[instance.status];
                    const providerData = providerInfo[instance.provider];
                    return (
                        <div
                            key={instance.id}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl">
                                            {providerData.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-white">{instance.instance_name}</h3>
                                                <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full', providerData.color)}>
                                                    {providerData.name}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-500 mt-0.5">
                                                {instance.phone_number || 'Número não configurado'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Live dot */}
                                        <div className="flex items-center gap-2">
                                            <div className={cn('w-2 h-2 rounded-full', cfg.dot, instance.status === 'connected' && 'animate-pulse')} />
                                            <span className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border', cfg.color)}>
                                                <cfg.icon className="w-3.5 h-3.5" />
                                                {cfg.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-800">
                                    <div>
                                        <p className="text-xs text-zinc-500">Provider</p>
                                        <p className="text-sm font-semibold text-white mt-0.5">{providerData.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Mensagens hoje</p>
                                        <p className="text-lg font-bold text-white mt-0.5">48</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Conversas ativas</p>
                                        <p className="text-lg font-bold text-white mt-0.5">3</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500">Webhook</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-xs text-emerald-400 font-medium">Ativo</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4">
                                    {instance.status !== 'connected' && (
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all cursor-pointer">
                                            <Wifi className="w-3.5 h-3.5" />
                                            Conectar
                                        </button>
                                    )}
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer">
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Reconectar
                                    </button>
                                    {instance.provider === 'uazapi' && (
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer">
                                            <QrCode className="w-3.5 h-3.5" />
                                            QR Code
                                        </button>
                                    )}
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer ml-auto">
                                        <WifiOff className="w-3.5 h-3.5" />
                                        Desconectar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {instances.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                        <Smartphone className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-300">Nenhum canal conectado</h3>
                    <p className="text-sm text-zinc-500 mt-1">Conecte seu WhatsApp para começar a receber mensagens</p>
                    <button
                        onClick={openDrawer}
                        className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Conectar WhatsApp
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                 NEW CONNECTION DRAWER
                ═══════════════════════════════════════════════ */}
            {showNewDrawer && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 animate-in fade-in duration-200" onClick={() => setShowNewDrawer(false)} />

                    <div className="fixed right-0 top-0 h-screen w-full max-w-lg bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col animate-in slide-in-from-right duration-200">
                        {/* Header */}
                        <div className="p-5 border-b border-zinc-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Nova Conexão WhatsApp</h2>
                                <button
                                    onClick={() => setShowNewDrawer(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Step indicator */}
                            <div className="flex items-center gap-2 mt-3">
                                {['Escolher API', 'Configurar', 'Conectar'].map((step, i) => {
                                    const stepIndex = i;
                                    const currentIndex = connectStep === 'select' ? 0 : connectStep === 'form' ? 1 : 2;
                                    return (
                                        <div key={step} className="flex items-center gap-2 flex-1">
                                            <div className={cn(
                                                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                                                stepIndex <= currentIndex
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-zinc-800 text-zinc-600'
                                            )}>
                                                {stepIndex < currentIndex ? '✓' : stepIndex + 1}
                                            </div>
                                            <span className={cn(
                                                'text-xs font-medium',
                                                stepIndex <= currentIndex ? 'text-zinc-300' : 'text-zinc-600'
                                            )}>
                                                {step}
                                            </span>
                                            {i < 2 && <div className={cn('flex-1 h-px', stepIndex < currentIndex ? 'bg-indigo-600' : 'bg-zinc-800')} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {/* ─── Step 1: Select Provider ─── */}
                            {connectStep === 'select' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
                                    <p className="text-sm text-zinc-400">Escolha como conectar seu WhatsApp:</p>

                                    {(Object.entries(providerInfo) as [WhatsAppProvider, typeof providerInfo.uazapi][]).map(([key, info]) => (
                                        <button
                                            key={key}
                                            onClick={() => selectProvider(key)}
                                            className={cn(
                                                'w-full text-left bg-zinc-900 border rounded-xl p-5 transition-all cursor-pointer hover:scale-[1.01]',
                                                info.borderColor
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-2xl">{info.icon}</span>
                                                <div>
                                                    <h3 className="font-semibold text-white">{info.name}</h3>
                                                    <p className="text-xs text-zinc-500">{info.description}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-zinc-600 ml-auto" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Vantagens</p>
                                                    {info.pros.map((pro) => (
                                                        <div key={pro} className="flex items-start gap-1.5">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                                            <span className="text-[11px] text-zinc-400">{pro}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider">Limitações</p>
                                                    {info.cons.map((con) => (
                                                        <div key={con} className="flex items-start gap-1.5">
                                                            <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                                            <span className="text-[11px] text-zinc-400">{con}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ─── Step 2: Form (UazAPI) ─── */}
                            {connectStep === 'form' && selectedProvider === 'uazapi' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">⚡</span>
                                        <h3 className="text-sm font-semibold text-white">Configurar UazAPI</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Nome da instância</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="Ex: Atendimento Principal"
                                            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-emerald-300">Configuração automática</p>
                                                <p className="text-[11px] text-emerald-200/60 mt-0.5">
                                                    A instância será criada automaticamente no servidor. Você não precisa configurar nada manualmente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5">
                                        <div className="flex items-start gap-2">
                                            <QrCode className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-amber-300">Próximo passo: QR Code</p>
                                                <p className="text-[11px] text-amber-200/60 mt-0.5">
                                                    Após criar, você escaneará o QR Code com o WhatsApp do celular para conectar.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 2: Form (Meta Cloud) ─── */}
                            {connectStep === 'form' && selectedProvider === 'meta_cloud' && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🛡️</span>
                                        <h3 className="text-sm font-semibold text-white">Configurar Meta Cloud API</h3>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Nome da instância</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="Ex: WhatsApp Business"
                                            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Access Token (permanente)</label>
                                        <input
                                            type="password"
                                            value={metaAccessToken}
                                            onChange={(e) => setMetaAccessToken(e.target.value)}
                                            placeholder="EAAxxxxxxxxxxxxxxxx"
                                            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                        <p className="text-[10px] text-zinc-600">
                                            Use um System User Token permanente. <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" className="text-indigo-400 hover:underline">Como obter →</a>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={metaPhoneNumberId}
                                            onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                                            placeholder="123456789012345"
                                            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Business Account ID <span className="text-zinc-600">(opcional)</span></label>
                                        <input
                                            type="text"
                                            value={metaBusinessId}
                                            onChange={(e) => setMetaBusinessId(e.target.value)}
                                            placeholder="987654321098765"
                                            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3.5">
                                        <div className="flex items-start gap-2">
                                            <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-blue-300">Webhook</p>
                                                <p className="text-[11px] text-blue-200/60 mt-0.5">
                                                    Configure no Meta App Dashboard apontando para:
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 bg-zinc-800 rounded-lg px-3 py-1.5">
                                                    <code className="text-[11px] text-zinc-300 flex-1 truncate">
                                                        https://seu-dominio.com/api/webhooks/whatsapp/{'<id>'}
                                                    </code>
                                                    <button className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href="https://developers.facebook.com/apps"
                                        target="_blank"
                                        className="flex items-center justify-center gap-2 py-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Abrir Meta for Developers
                                    </a>
                                </div>
                            )}

                            {/* ─── Step 3: Connecting ─── */}
                            {connectStep === 'connecting' && (
                                <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in-95 duration-300">
                                    {selectedProvider === 'uazapi' ? (
                                        <>
                                            <div className="w-48 h-48 bg-zinc-800 border-2 border-dashed border-zinc-600 rounded-2xl flex items-center justify-center mb-6">
                                                <div className="text-center">
                                                    <QrCode className="w-16 h-16 text-zinc-500 mx-auto mb-2" />
                                                    <p className="text-xs text-zinc-500">QR Code aqui</p>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-white mb-1">Escaneie o QR Code</h3>
                                            <p className="text-sm text-zinc-400 text-center max-w-xs">
                                                Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar aparelho
                                            </p>
                                            <div className="flex items-center gap-2 mt-4">
                                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                                <span className="text-xs text-indigo-400">Aguardando conexão...</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                                                {isSubmitting ? (
                                                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                {isSubmitting ? 'Validando token...' : 'Conectado!'}
                                            </h3>
                                            <p className="text-sm text-zinc-400 text-center max-w-xs">
                                                {isSubmitting
                                                    ? 'Verificando credenciais com a Meta...'
                                                    : 'Sua instância foi conectada com sucesso.'
                                                }
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-zinc-800 flex items-center gap-3">
                            {connectStep === 'form' && (
                                <button
                                    onClick={() => setConnectStep('select')}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer"
                                >
                                    Voltar
                                </button>
                            )}
                            {connectStep === 'select' && (
                                <button
                                    onClick={() => setShowNewDrawer(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            )}
                            {connectStep === 'form' && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        isSubmitting ||
                                        (selectedProvider === 'meta_cloud' && (!metaAccessToken || !metaPhoneNumberId))
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <Zap className="w-4 h-4" />
                                    {selectedProvider === 'uazapi' ? 'Criar e Gerar QR Code' : 'Validar e Conectar'}
                                </button>
                            )}
                            {connectStep === 'connecting' && !isSubmitting && (
                                <button
                                    onClick={() => setShowNewDrawer(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all cursor-pointer"
                                >
                                    Fechar
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
