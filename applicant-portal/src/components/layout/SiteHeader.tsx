import { NavLink } from 'react-router-dom'
import { BookOpen, ChevronDown, Sun } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/admissions', label: 'Admissions', end: false },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e4e9f4] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-[#15d6d8] to-[#2cc699]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[#071759]">Taleem AI</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-[#0c3cff] text-[#0c3cff]'
                      : 'text-[#354a8d] hover:text-[#071759]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-[#6374ab] hover:bg-[#f1f5fb]"
            aria-label="Theme"
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-[#e4e9f4] bg-white py-1 pr-2.5 pl-1 text-sm text-[#19316f]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#edf3ff] text-xs font-semibold text-[#0c3cff]">
              SA
            </span>
            <span className="hidden sm:inline">Student Applicant</span>
            <ChevronDown className="h-4 w-4 text-[#6374ab]" />
          </button>
        </div>
      </div>
    </header>
  )
}
