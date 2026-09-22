import { Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { AcademicYearField } from '@/components/shared/AcademicYearField'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { normalizeAcademicYear } from '@/lib/academic-year'
import { intakeTypes } from '@/data/intakes-data'
import type { IntakeFlowData } from '@/types/intake-flow'

type IntakeInformationStepProps = {
  data: IntakeFlowData
  onChange: (data: IntakeFlowData) => void
  errors: Record<string, string>
  showErrors: boolean
  onBlur: (field: string) => void
}

export function IntakeInformationStep({ data, onChange, errors, showErrors, onBlur }: IntakeInformationStepProps) {
  const err = (field: string) => (showErrors ? errors[field] : '')

  return (
    <Card className="border-[#e1e8f5] p-6 shadow-none">
      <h2 className="text-lg font-bold text-[#071759]">Intake Information</h2>
      <p className="mt-1 text-sm text-[#6374ab]">
        Provide the basic details for the new intake. You can configure application periods, programme offerings,
        eligibility criteria and more in the following steps.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#071759]">
            Intake Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={data.name}
            onChange={e => onChange({ ...data, name: e.target.value })}
            onBlur={() => onBlur('name')}
            placeholder="e.g. Fall 2027"
            className={`h-10 border-[#b8c6ed] ${err('name') ? 'border-red-500' : ''}`}
          />
          {err('name') && <p className="text-xs text-red-600">{err('name')}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#071759]">
            Intake Code <span className="text-red-500">*</span>
          </label>
          <Input
            value={data.code}
            onChange={e => onChange({ ...data, code: e.target.value.toUpperCase() })}
            onBlur={() => onBlur('code')}
            placeholder="e.g. F27"
            className={`h-10 border-[#b8c6ed] ${err('code') ? 'border-red-500' : ''}`}
          />
          {!err('code') && (
            <p className="text-xs text-[#6374ab]">
              Unique reference code (e.g. FALL-2026). Letters, numbers, dots, hyphens, and underscores only.
            </p>
          )}
          {err('code') && <p className="text-xs text-red-600">{err('code')}</p>}
        </div>

        <AcademicYearField
          value={data.academicYear}
          onChange={value => onChange({ ...data, academicYear: normalizeAcademicYear(value) })}
          onBlur={() => onBlur('academicYear')}
          error={err('academicYear')}
        />

        <SearchSelect
          label="Intake Type"
          value={data.intakeType}
          onChange={value => onChange({ ...data, intakeType: value })}
          onBlur={() => onBlur('intakeType')}
          options={intakeTypes}
          placeholder="Select intake type"
          error={err('intakeType')}
          required={false}
        />

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-semibold text-[#071759]">Description</label>
          <div className="relative">
            <Textarea
              value={data.description}
              onChange={e => onChange({ ...data, description: e.target.value.slice(0, 500) })}
              onBlur={() => onBlur('description')}
              placeholder="Add a brief description (optional)"
              className="min-h-28 resize-none border-[#b8c6ed] pb-7"
            />
            <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#6374ab]">
              {data.description.length}/500
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 rounded-lg border border-[#c7d9ff] bg-[#edf3ff] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0644ff]" />
        <div>
          <p className="text-sm font-semibold text-[#071759]">What happens next?</p>
          <p className="mt-1 text-sm text-[#43599e]">
            Continue through the steps to set application periods, add programme offerings, configure admission
            criteria, fees and other details for this intake.
          </p>
        </div>
      </div>
    </Card>
  )
}
