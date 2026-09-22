import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lock,
  Mail,
  Moon,
  Shield,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'

type FieldErrors = {
  email?: string
  password?: string
  form?: string
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/intakes'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  function validate() {
    const next: FieldErrors = {}

    if (!email.trim()) next.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.'
    }

    if (!password) next.password = 'Password is required.'

    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    const fieldErrors = validate()
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (!result.ok) {
      setErrors({ form: result.message })
      return
    }

    navigate(from, { replace: true })
  }

  const showError = (field: keyof FieldErrors) => (submitted || touched[field]) && errors[field]

  return (
    <div className="flex min-h-screen bg-[#f4f7fc]">
      <section className="relative hidden w-[42%] overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f5f3ff] to-[#ede9fe] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-[#c7d2fe]/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-32 right-8 h-48 w-48 rounded-full bg-[#ddd6fe]/50 blur-2xl" />
        <div className="pointer-events-none absolute bottom-12 right-24 grid grid-cols-6 gap-2 opacity-30">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#15d6d8] to-[#2cc699]">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#071759]">Taleem AI</p>
            <p className="text-sm text-[#64748b]">Admissions Management</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-[#1e3a8a]">
            Smarter Admissions for a Brighter Tomorrow
          </h1>
          <div className="mt-5 h-1 w-16 rounded-full bg-[#4f46e5]" />
        </div>

        <p className="relative z-10 text-sm text-[#64748b]">© 2024 Taleem AI. All rights reserved.</p>
      </section>

      <section className="flex flex-1 flex-col">
        <div className="flex justify-end p-5 sm:p-6">
          <div
            className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-sm"
            aria-label="Theme toggle"
          >
            <button
              type="button"
              className="rounded-md bg-[#eef2ff] p-2 text-[#4f46e5]"
              aria-label="Light mode"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-md p-2 text-[#94a3b8]"
              aria-label="Dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md rounded-2xl border border-[#e8edf5] bg-white px-8 py-10 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-[#eef2ff]">
              <GraduationCap className="h-7 w-7 text-[#4f46e5]" />
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold text-[#0f172a]">Welcome back</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
                Sign in to manage admissions intakes and programme offerings.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#334155]">
                  Email address
                </label>
                <div
                  className={`flex h-11 items-center gap-2 rounded-lg border bg-white px-3 ${
                    showError('email') ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    placeholder="Enter your email address"
                    className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                {showError('email') && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#334155]">
                  Password
                </label>
                <div
                  className={`flex h-11 items-center gap-2 rounded-lg border bg-white px-3 ${
                    showError('password') ? 'border-red-500' : 'border-[#e2e8f0]'
                  }`}
                >
                  <Lock className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    placeholder="Enter your password"
                    className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="text-xs font-medium text-[#64748b] hover:text-[#334155]"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showError('password') && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-sm font-medium text-[#4f46e5] hover:underline">
                  Forgot password?
                </button>
              </div>

              {errors.form && <p className="text-center text-xs text-red-600">{errors.form}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[#4f46e5] text-base font-semibold hover:bg-[#4338ca]"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#f1f5f9] pt-6 text-xs text-[#94a3b8]">
              <Shield className="h-3.5 w-3.5" />
              Secure access. Authorized users only.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
