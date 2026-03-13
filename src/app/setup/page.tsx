'use client';

import { useSetupStore } from '@/stores/setup';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { StepIndicator } from '@/components/wizard/step-indicator';
import { StepRoutingType } from '@/components/wizard/step-routing-type';
import { StepSectors } from '@/components/wizard/step-sectors';
import { StepRules } from '@/components/wizard/step-rules';
import { StepFallback } from '@/components/wizard/step-fallback';
import { StepConnect } from '@/components/wizard/step-connect';
import { ArrowLeft, ArrowRight, Zap, MessageSquareMore, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const stepLabels = ['Roteamento', 'Setores', 'Regras', 'Fallback', 'Conectar'];

export default function SetupPage() {
    const { currentStep, setStep, data, markComplete } = useSetupStore();
    const { organization } = useUser();
    const router = useRouter();
    const [isActivating, setIsActivating] = useState(false);

    const canAdvance = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!data.routingType;
            case 2: {
                const activeSectors = data.sectors?.filter((s) => s.is_active && s.name) || [];
                return activeSectors.length >= 1;
            }
            case 3: {
                const activeRules = (data.rules as { is_active?: boolean }[])?.filter((r) => r.is_active) || [];
                return activeRules.length >= 1;
            }
            case 4:
                return !!data.fallback?.sectorId && !!data.fallback?.message;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < 5) {
            setStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
        }
    };

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            const res = await fetch('/api/organizations/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                markComplete();
                router.push('/dashboard');
            } else {
                console.error('Erro ao salvar setup no backend');
            }
        } catch (error) {
            console.error('Falha de rede ao salvar setup', error);
        } finally {
            setIsActivating(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepRoutingType />;
            case 2:
                return <StepSectors />;
            case 3:
                return <StepRules />;
            case 4:
                return <StepFallback />;
            case 5:
                return <StepConnect />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 bg-slate-950/50 p-8 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                    {organization?.logo_url ? (
                        <img src={organization.logo_url} alt="Logo" className="w-7 h-7 object-contain" />
                    ) : (
                        <MessageSquareMore className="w-6 h-6 text-blue-400" />
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Configurar {organization?.name || 'TriaGO'}</h1>
                    <p className="text-slate-500 text-sm">Vamos deixar tudo pronto para o seu primeiro atendimento</p>
                </div>
            </div>

            {/* Step indicator */}
            <div className="px-4">
                <StepIndicator
                    currentStep={currentStep}
                    totalSteps={5}
                    labels={stepLabels}
                />
            </div>

            {/* Step content */}
            <div className="min-h-[400px] flex flex-col items-center justify-center py-4 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                <div className="w-full max-w-2xl px-4">
                    {renderStep()}
                </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800/60">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1 || isActivating}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all',
                        currentStep > 1 && !isActivating
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                            : 'text-slate-600 cursor-not-allowed opacity-0'
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>

                <div className="flex gap-3">
                    {currentStep < 5 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canAdvance()}
                            className={cn(
                                'flex items-center gap-2 px-8 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-xl',
                                canAdvance()
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                                    : 'bg-slate-800 text-slate-500'
                            )}
                        >
                            Próximo
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={isActivating}
                            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xl shadow-emerald-600/20"
                        >
                            {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {isActivating ? 'Finalizando...' : 'Ativar TriaGO'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
