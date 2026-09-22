import { LayoutDashboard } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function DashboardPage() {
  return (
    <>
      <div className="mb-5">
        <p className="mb-1 text-sm text-[#40559e]">Overview</p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[#43599e]">Welcome to the Taleem AI Admissions CMS.</p>
      </div>

      <Card className="flex flex-col items-center justify-center border-[#e1e8f5] p-16 shadow-none">
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#edf3ff] text-[#0644ff]">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Dashboard coming soon</h2>
        <p className="mt-2 max-w-md text-center text-[#43599e]">
          Use the sidebar to manage departments, programmes, admission criteria, and application fees.
        </p>
      </Card>
    </>
  )
}
