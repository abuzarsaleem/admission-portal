import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { BookOpen, LogOut } from 'lucide-react'
import { appNavItems } from '@/data/app-nav'

type AppSidebarProps = {
  onNavigate?: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
    isActive ? 'border-l-2 border-[#a78bfa] bg-[#263d70] font-semibold text-white' : 'text-white hover:bg-white/10'
  }`

const mainSections = ['Admissions', 'Academic Catalogue', 'Configuration'] as const

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <nav className="space-y-1 px-3 py-5">
      {mainSections.map(section => {
        const items = appNavItems.filter(item => item.section === section)
        if (items.length === 0) return null
        return (
          <div key={section}>
            <p
              className={`px-3 pb-2 text-[11px] font-semibold tracking-widest text-[#b4c6dc] ${
                section === 'Admissions' ? '' : 'pt-5'
              }`}
            >
              {section.toUpperCase()}
            </p>
            {items.map(item => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={onNavigate}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

export function SidebarFooter() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const systemItems = appNavItems.filter(item => item.section === 'System')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="absolute inset-x-6 bottom-6 border-t border-white/15 pt-5 text-sm text-white">
      {systemItems.map(item => {
        const Icon = item.icon
        return (
          <NavLink key={item.to} to={item.to} className="mb-3 flex cursor-pointer items-center gap-3 hover:text-white/90">
            <Icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        )
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full cursor-pointer items-center gap-3 text-left hover:text-white/90"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
      <div className="mt-7 flex justify-between text-xs text-[#c5d1df]">
        <span>Taleem AI CMS</span>
        <span>v1.0.0</span>
      </div>
    </div>
  )
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 px-6 py-6">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-[#15d6d8] to-[#2cc699]">
        <BookOpen className="h-6 w-6 text-white" />
      </div>
      <span className="text-xl font-bold text-white">Taleem AI</span>
    </div>
  )
}
