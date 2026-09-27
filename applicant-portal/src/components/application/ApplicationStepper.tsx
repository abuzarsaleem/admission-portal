import { Check } from 'lucide-react'
import { APPLICATION_STEPS } from '@/lib/application-steps'
import type { ApplicationStepId } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Props = {
  currentStep: ApplicationStepId
  completed: Partial<Record<ApplicationStepId, boolean>>
  onStepClick?: (step: ApplicationStepId) => void
}

export function ApplicationStepper({ currentStep, completed, onStepClick }: Props) {
  const currentIndex = APPLICATION_STEPS.findIndex(step => step.id === currentStep)

  return (
    <ol className="flex flex-wrap items-start gap-2 border-b border-[#e4e9f4] pb-5 sm:gap-0">
      {APPLICATION_STEPS.map((step, index) => {
        const isCurrent = step.id === currentStep
        const isComplete = !!completed[step.id] && !isCurrent
        const isReachable = index <= currentIndex || !!completed[step.id]
        const connectorDone = index < currentIndex || (!!completed[step.id] && index < APPLICATION_STEPS.length - 1)

        return (
          <li
            key={step.id}
            className={cn(
              'relative flex min-w-[7.5rem] flex-1 flex-col items-center gap-2 px-1',
              index < APPLICATION_STEPS.length - 1 &&
                "sm:after:absolute sm:after:left-[calc(50%+1.1rem)] sm:after:top-4 sm:after:h-0.5 sm:after:w-[calc(100%-2.2rem)] sm:after:content-['']",
              connectorDone ? 'sm:after:bg-[#0c3cff]' : 'sm:after:bg-[#dce5f6]',
            )}
          >
            <button
              type="button"
              disabled={!isReachable || !onStepClick}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                'relative z-10 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition',
                isComplete && 'bg-[#0c3cff] text-white',
                isCurrent && 'bg-[#0c3cff] text-white ring-4 ring-[#dbe7ff]',
                !isComplete && !isCurrent && 'bg-[#e8edf5] text-[#6374ab]',
                isReachable && onStepClick && 'hover:opacity-90',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? <Check className="h-4 w-4" /> : step.number}
            </button>
            <div className="text-center">
              <p
                className={cn(
                  'text-xs font-semibold sm:text-sm',
                  isCurrent || isComplete ? 'text-[#071759]' : 'text-[#6374ab]',
                )}
              >
                {step.shortTitle}
              </p>
              <p className="hidden text-[11px] text-[#94a3b8] sm:block">
                {isComplete ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
