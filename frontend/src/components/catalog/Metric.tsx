import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

type MetricProps = {
  value: string
  label: string
  icon: LucideIcon
  success?: boolean
}

export function Metric({ value, label, icon: Icon, success = false }: MetricProps) {
  return (
    <Card className="border-[#e1e8f5] p-5 shadow-none">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-xl ${success ? 'bg-[#e0f9ed] text-[#00a768]' : 'bg-[#edf3ff] text-[#0644ff]'}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[#415699]">{label}</p>
        </div>
      </div>
    </Card>
  )
}
