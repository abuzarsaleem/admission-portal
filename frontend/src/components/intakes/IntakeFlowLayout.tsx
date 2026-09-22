import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HorizontalStepper } from '@/components/intakes/HorizontalStepper'
import { intakeSteps } from '@/data/intakes-data'

type IntakeFlowLayoutProps = {
  mode: 'create' | 'configure'
  intakeName: string
  intakeCode: string
  currentStep: number
  onStepClick: (index: number) => void
  onPrevious: () => void
  onSave: () => void
  onContinue: () => void
  isLastStep?: boolean
  continueLabel?: string
  saving?: boolean
  children: ReactNode
}

function getStepSubtitle(stepIndex: number) {
  const subtitles = [
    'Set up a new admissions cycle to begin configuring its programme offerings.',
    'Set the opening and closing dates for this intake. Applicants will be able to start and submit applications within this period.',
    'Select the programmes that will be available in this intake.',
    'Configure admission criteria and application fees for each selected programme.',
    'Review all configuration details before submitting for approval.',
  ]
  return subtitles[stepIndex] ?? ''
}

export function IntakeFlowLayout({
  mode,
  intakeName,
  intakeCode,
  currentStep,
  onStepClick,
  onPrevious,
  onSave,
  onContinue,
  isLastStep = false,
  continueLabel,
  saving = false,
  children,
}: IntakeFlowLayoutProps) {
  const continueText = saving
    ? isLastStep
      ? 'Submitting...'
      : 'Saving...'
    : (continueLabel ?? (isLastStep ? 'Submit for Review' : 'Save & Continue'))
  const step = intakeSteps[currentStep]
  const displayName = intakeName || 'New Intake'
  const displayCode = intakeCode ? ` (${intakeCode})` : ''

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col">
      <p className="mb-4 text-sm text-[#40559e]">
        <Link to="/intakes" className="hover:text-[#0644ff]">
          Admissions
        </Link>
        <span className="px-1.5">›</span>
        <Link to="/intakes" className="hover:text-[#0644ff]">
          Intakes
        </Link>
        {mode === 'configure' && intakeCode && (
          <>
            <span className="px-1.5">›</span>
            <span>
              {displayName}
              {displayCode}
            </span>
          </>
        )}
        {mode === 'create' && currentStep === 0 && (
          <>
            <span className="px-1.5">›</span>
            <span>Create Intake</span>
          </>
        )}
        {(mode === 'configure' || currentStep > 0) && (
          <>
            <span className="px-1.5">›</span>
            <span>Configure</span>
            <span className="px-1.5">›</span>
            <span>{step.label}</span>
          </>
        )}
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-[#071759]">{step.label}</h1>
        <Badge className="border-0 bg-[#e3edff] text-[#0644ff] hover:bg-[#e3edff]">Draft</Badge>
        {intakeName && (
          <span className="text-lg text-[#6374ab]">
            {displayName}
            {displayCode}
          </span>
        )}
      </div>
      <p className="mb-6 text-[#43599e]">{getStepSubtitle(currentStep)}</p>

      <div className="mb-8 rounded-lg border border-[#e1e8f5] bg-white px-4 py-5 sm:px-6">
        <HorizontalStepper currentStep={currentStep} onStepClick={onStepClick} />
      </div>

      <div className="flex-1">{children}</div>

      <div className="sticky bottom-0 -mx-5 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9f4] bg-[#f8faff] px-5 py-4 lg:-mx-7 lg:px-7">
        {currentStep > 0 ? (
          <Button variant="outline" className="h-11 border-[#dce5f6] px-5 text-[#354a8d]" onClick={onPrevious}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        ) : (
          <Link to="/intakes">
            <Button variant="outline" className="h-11 border-[#dce5f6] px-5 text-[#354a8d]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 border-[#dce5f6] px-5 text-[#354a8d]"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button className="h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={onContinue} disabled={saving}>
            {continueText}
            {!isLastStep && !saving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
