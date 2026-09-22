import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

type StatCardProps = {
  value: string | number
  label: string
  icon?: LucideIcon
  dotColor?: string
  dotBg?: string
  iconBg?: string
}

export function StatCard({
  value,
  label,
  icon: Icon,
  dotColor,
  dotBg = 'bg-[#edf3ff]',
  iconBg = 'bg-[#edf3ff] text-[#0644ff]',
}: StatCardProps) {
  return (
    <Card className="border-[#e1e8f5] p-5 shadow-none">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${dotColor ? dotBg : iconBg}`}>
          {Icon ? (
            <Icon className="h-7 w-7" />
          ) : (
            <span className={`h-3.5 w-3.5 rounded-full ${dotColor}`} />
          )}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-[#071759]">{value}</p>
          <p className="text-sm text-[#415699]">{label}</p>
        </div>
      </div>
    </Card>
  )
}
