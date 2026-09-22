import { Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function AuditActivityPage() {
  return (
    <>
      <div className="mb-5">
        <p className="mb-1 text-sm text-[#40559e]">System</p>
        <h1 className="text-3xl font-bold tracking-tight">Audit & Activity</h1>
        <p className="mt-1 text-[#43599e]">View system audit logs and activity history.</p>
      </div>

      <Card className="flex flex-col items-center justify-center border-[#e1e8f5] p-16 shadow-none">
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#edf3ff] text-[#0644ff]">
          <Activity className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Audit & Activity coming soon</h2>
      </Card>
    </>
  )
}
