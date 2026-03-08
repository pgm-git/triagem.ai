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
                                    isCompleted && 'bg-indigo-600 text-white',
                                    isActive && 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/50',
                                    !isActive && !isCompleted && 'bg-zinc-800 text-zinc-500'
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step}
                            </div>
                            <span
                                className={cn(
                                    'text-[11px] font-medium whitespace-nowrap',
                                    isActive ? 'text-indigo-400' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
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
                                        step < currentStep ? 'bg-indigo-600' : 'bg-zinc-800'
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
