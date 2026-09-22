import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Activity,
  BookOpen,
  Building2,
  CircleDollarSign,
  FileCheck2,
  GraduationCap,
  LogOut,
  Settings,
} from 'lucide-react'

type AppSidebarProps = {
  onNavigate?: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
    isActive ? 'border-l-2 border-[#a78bfa] bg-[#263d70] font-semibold text-white' : 'text-white hover:bg-white/10'
  }`

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <nav className="space-y-1 px-3 py-5">
      <p className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-[#b4c6dc]">ADMISSIONS</p>
      <NavLink to="/intakes" className={navLinkClass} onClick={onNavigate}>
        <FileCheck2 className="h-5 w-5" />
        Intakes
      </NavLink>

      <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-[#b4c6dc]">ACADEMIC CATALOGUE</p>
      <NavLink to="/catalog/programmes" className={navLinkClass} onClick={onNavigate}>
        <GraduationCap className="h-5 w-5" />
        Programmes
      </NavLink>
      <NavLink to="/catalog/departments" className={navLinkClass} onClick={onNavigate}>
        <Building2 className="h-5 w-5" />
        Departments
      </NavLink>

      <p className="px-3 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-[#b4c6dc]">CONFIGURATION</p>
      <NavLink to="/configuration/admission-criteria" className={navLinkClass} onClick={onNavigate}>
        <FileCheck2 className="h-5 w-5" />
        Admission Criteria
      </NavLink>
      <NavLink to="/configuration/application-fees" className={navLinkClass} onClick={onNavigate}>
        <CircleDollarSign className="h-5 w-5" />
        Application Fees
      </NavLink>
    </nav>
  )
}

export function SidebarFooter() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="absolute inset-x-6 bottom-6 border-t border-white/15 pt-5 text-sm text-white">
      <NavLink to="/audit-activity" className="mb-3 flex items-center gap-3 hover:text-white/90">
        <Activity className="h-5 w-5" />
        Audit & Activity
      </NavLink>
      <NavLink to="/settings" className="mb-3 flex items-center gap-3 hover:text-white/90">
        <Settings className="h-5 w-5" />
        Settings
      </NavLink>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 text-left hover:text-white/90"
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
