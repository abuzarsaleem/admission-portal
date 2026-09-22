import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar, SidebarBrand, SidebarFooter } from '@/components/layout/AppSidebar'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#071759]">
      <aside className="fixed inset-y-0 z-30 hidden w-61 bg-gradient-to-b from-[#08213b] to-[#061a31] lg:block">
        <SidebarBrand />
        <AppSidebar />
        <SidebarFooter />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden">
          <aside className="h-full w-70 bg-[#08213b]">
            <div className="flex items-center justify-between px-5 py-5 text-white">
              <b>Taleem AI</b>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-61">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <div className="p-5 lg:p-7">
          <Outlet />
        </div>
      </main>

      <Toaster richColors position="bottom-right" />
    </div>
  )
}
