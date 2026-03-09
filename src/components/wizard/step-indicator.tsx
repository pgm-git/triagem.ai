'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    labels: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-between mb-10">
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className="flex items-center flex-1 last:flex-0">
                        {/* Step circle */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={cn(
                                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                                    isCompleted && 'bg-blue-600 text-white',
                                    isActive && 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50',
                                    !isActive && !isCompleted && 'bg-slate-800 text-slate-500'
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step}
                            </div>
                            <span
                                className={cn(
                                    'text-[11px] font-medium whitespace-nowrap',
                                    isActive ? 'text-blue-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                                )}
                            >
                                {labels[i]}
                            </span>
                        </div>

                        {/* Connector line */}
                        {step < totalSteps && (
                            <div className="flex-1 mx-2 mt-[-18px]">
                                <div
                                    className={cn(
                                        'h-[2px] rounded-full transition-all duration-500',
                                        step < currentStep ? 'bg-blue-600' : 'bg-slate-800'
                                    )}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
