import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/auth'

const navLinkClass = (active: boolean) =>
  `px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'border-b-2 border-[#0c3cff] text-[#0c3cff]'
      : 'text-[#4a5d8f] hover:text-[#071759]'
  }`

export function SiteHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const onHome = location.pathname === '/'
  const onMyApplication =
    location.pathname.startsWith('/my-application') ||
    location.pathname.startsWith('/applications')
  const onAdmissions =
    !onHome &&
    !onMyApplication &&
    (location.pathname.startsWith('/intakes') ||
      location.pathname.startsWith('/offerings') ||
      location.pathname.startsWith('/apply'))

  function handleLogout() {
    logout()
    navigate('/sign-in', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8eef8] bg-white">
      <div className="mx-auto grid h-[4.25rem] max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 justify-self-start">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-[#15d6d8] to-[#2cc699]">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[#071759]">Taleem AI</span>
        </Link>

        <nav className="hidden items-center gap-1 justify-self-center md:flex">
          <NavLink to="/" end className={({ isActive }) => navLinkClass(isActive)}>
            Home
          </NavLink>
          <a href="/#intakes" className={navLinkClass(onAdmissions)}>
            Admissions
          </a>
          <a href="/#programmes" className={navLinkClass(false)}>
            Programmes
          </a>
          <a href="/#about" className={navLinkClass(false)}>
            About Us
          </a>
          <a href="/#faq" className={navLinkClass(false)}>
            FAQ
          </a>
          {isAuthenticated ? (
            <NavLink
              to="/my-application"
              className={({ isActive }) => navLinkClass(isActive || onMyApplication)}
            >
              My Application
            </NavLink>
          ) : null}
        </nav>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-[#6374ab] hover:bg-[#f1f5fb]"
            aria-label="Theme"
          >
            <Sun className="h-4 w-4" />
          </button>

          {isAuthenticated && user ? (
            <>
              <Link
                to="/my-application"
                className="inline-flex h-9 items-center rounded-md border border-[#c5d0ea] px-3 text-sm font-medium text-[#19316f] hover:bg-[#f8faff] md:hidden"
              >
                My App
              </Link>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#edf3ff] text-xs font-semibold text-[#0c3cff]">
                  {getInitials(user.name) || 'A'}
                </span>
                <span className="max-w-36 truncate text-sm font-medium text-[#19316f]">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#c5d0ea] px-3 text-sm font-medium text-[#19316f] hover:bg-[#f8faff]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="inline-flex h-9 items-center rounded-md border border-[#0c3cff] px-3 text-sm font-semibold text-[#0c3cff] hover:bg-[#f8faff] sm:px-4"
              >
                Sign In
              </Link>
              <Link
                to="/#intakes"
                className="inline-flex h-9 items-center rounded-md bg-[#0c3cff] px-3 text-sm font-semibold text-white hover:bg-[#0934dc] sm:px-4"
              >
                Create Application
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
