import { Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function SettingsPage() {
  return (
    <>
      <div className="mb-5">
        <p className="mb-1 text-sm text-[#40559e]">System</p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-[#43599e]">Configure your admissions portal preferences.</p>
      </div>

      <Card className="flex flex-col items-center justify-center border-[#e1e8f5] p-16 shadow-none">
        <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#edf3ff] text-[#0644ff]">
          <Settings className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Settings coming soon</h2>
        <p className="mt-2 max-w-md text-center text-[#43599e]">
          Portal configuration and user preferences will be available here.
        </p>
      </Card>
    </>
  )
}
