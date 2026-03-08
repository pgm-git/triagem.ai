'use client';

import { useSetupStore } from '@/stores/setup';
import { useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/wizard/step-indicator';
import { StepRoutingType } from '@/components/wizard/step-routing-type';
import { StepSectors } from '@/components/wizard/step-sectors';
import { StepRules } from '@/components/wizard/step-rules';
import { StepFallback } from '@/components/wizard/step-fallback';
import { StepConnect } from '@/components/wizard/step-connect';
import { ArrowLeft, ArrowRight, Zap, MessageSquareMore } from 'lucide-react';
import { cn } from '@/lib/utils';

const stepLabels = ['Roteamento', 'Setores', 'Regras', 'Fallback', 'Conectar'];

export default function SetupPage() {
    const { currentStep, setStep, data, markComplete } = useSetupStore();
    const router = useRouter();

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

    const handleActivate = () => {
        markComplete();
        router.push('/dashboard');
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
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <MessageSquareMore className="w-5 h-5 text-indigo-400" />
                </div>
                <h1 className="text-lg font-semibold text-zinc-300">Configurar TrackerAi Pro</h1>
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
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                {currentStep > 1 ? (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
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
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-zinc-800 text-zinc-500'
                        )}
                    >
                        Próximo
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleActivate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all cursor-pointer"
                    >
                        <Zap className="w-4 h-4" />
                        Ativar TrackerAi Pro
                    </button>
                )}
            </div>
        </div>
    );
}
