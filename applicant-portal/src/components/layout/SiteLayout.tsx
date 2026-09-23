import { Outlet } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <SiteHeader />
      <Outlet />
    </div>
  )
}
