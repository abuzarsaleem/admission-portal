import { Check } from 'lucide-react'
import { intakeSteps } from '@/data/intakes-data'

type HorizontalStepperProps = {
  currentStep: number
  onStepClick?: (index: number) => void
}

export function HorizontalStepper({ currentStep, onStepClick }: HorizontalStepperProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[720px] items-start">
        {intakeSteps.map((step, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isUpcoming = index > currentStep
          const clickable = isCompleted && onStepClick

          return (
            <div key={step.slug} className="flex flex-1 items-start">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(index)}
                className={`group flex min-w-0 flex-1 flex-col items-center px-1 text-center ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-[#00a768] text-white'
                      : isActive
                        ? 'bg-[#0c3cff] text-white'
                        : 'border-2 border-[#dce5f6] bg-white text-[#6374ab]'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <p
                  className={`mt-2 text-xs font-semibold leading-tight ${
                    isActive ? 'text-[#0c3cff]' : isUpcoming ? 'text-[#6374ab]' : 'text-[#071759]'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 hidden text-[10px] leading-tight text-[#6374ab] sm:block">{step.description}</p>
              </button>
              {index < intakeSteps.length - 1 && (
                <div
                  className={`mx-1 mt-4 h-0.5 min-w-4 flex-1 ${index < currentStep ? 'bg-[#00a768]' : 'bg-[#dce5f6]'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
