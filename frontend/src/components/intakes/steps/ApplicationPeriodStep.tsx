import { Clock, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { DateField } from '@/components/shared/DateField'
import type { IntakeFlowData } from '@/types/intake-flow'

type ApplicationPeriodStepProps = {
  data: IntakeFlowData
  onChange: (data: IntakeFlowData) => void
  errors: Record<string, string>
  showErrors: boolean
  onBlur: (field: string) => void
}

export function ApplicationPeriodStep({ data, onChange, errors, showErrors, onBlur }: ApplicationPeriodStepProps) {
  const err = (field: string) => (showErrors ? errors[field] : '')

  return (
    <Card className="border-[#e1e8f5] p-6 shadow-none">
      <h2 className="text-lg font-bold text-[#071759]">Application Period</h2>
      <p className="mt-1 text-sm text-[#6374ab]">
        Define when applicants can start and submit their applications for this intake.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-3 block text-sm font-semibold text-[#071759]">
            Application Opens At <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              value={data.opensDate}
              onChange={v => onChange({ ...data, opensDate: v })}
              onBlur={() => onBlur('opensDate')}
              error={err('opensDate')}
            />
            <div className="relative">
              <Input
                type="time"
                value={data.opensTime}
                onChange={e => onChange({ ...data, opensTime: e.target.value })}
                className="h-10 border-[#b8c6ed] bg-white pr-10 text-[#071759] [color-scheme:light]"
              />
              <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6374ab]" />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-3 block text-sm font-semibold text-[#071759]">
            Application Closes At <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              value={data.closesDate}
              onChange={v => onChange({ ...data, closesDate: v })}
              onBlur={() => onBlur('closesDate')}
              error={err('closesDate')}
            />
            <div className="relative">
              <Input
                type="time"
                value={data.closesTime}
                onChange={e => onChange({ ...data, closesTime: e.target.value })}
                className="h-10 border-[#b8c6ed] bg-white pr-10 text-[#071759] [color-scheme:light]"
              />
              <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6374ab]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 rounded-lg border border-[#c7d9ff] bg-[#edf3ff] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0644ff]" />
        <div>
          <p className="text-sm font-semibold text-[#071759]">Important</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#43599e]">
            <li>The application period must fall within the academic year of this intake.</li>
            <li>Applicants cannot submit applications outside the defined opening and closing dates.</li>
            <li>You can edit these dates while the intake is in Draft status.</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
