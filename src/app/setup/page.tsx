'use client';

import { useSetupStore } from '@/stores/setup';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <MessageSquareMore className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-lg font-semibold text-slate-300">Configurar TriaGO</h1>
            </div>

            {/* Step indicator */}
            <StepIndicator
                currentStep={currentStep}
                totalSteps={5}
                labels={stepLabels}
            />

            {/* Step content */}
            <div className="min-h-[320px]">{renderStep()}</div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {currentStep > 1 ? (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                ) : (
                    <div />
                )}

                {currentStep < 5 ? (
                    <button
                        onClick={handleNext}
                        disabled={!canAdvance()}
                        className={cn(
                            'flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed',
                            canAdvance()
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                    >
                        {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {isActivating ? 'Salvando...' : 'Ativar TriaGO'}
                    </button>
                )}
            </div>
        </div>
    );
}
