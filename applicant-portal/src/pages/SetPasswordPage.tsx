import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import { setApplicantPassword } from '@/lib/api/registration'
import {
  getLatestApplicationBinding,
  saveApplicantIdentity,
  upsertApplicationBinding,
  getApplicantIdentity,
} from '@/lib/application-session'
import { useAuth } from '@/context/AuthContext'

export function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const token = searchParams.get('token')?.trim() ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  if (isAuthenticated && !done) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!token) {
      setError('This link is missing a verification token. Open the link from your email again.')
      return
    }
    if (password.length < 8 || password.length > 128) {
      setError('Password must be between 8 and 128 characters.')
      return
    }
    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must include at least one uppercase letter and one number.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const result = await setApplicantPassword({ token, password })
      setEmail(result.email)
      if (result.applicantId) {
        const existing = getLatestApplicationBinding(result.email)
        if (existing) {
          upsertApplicationBinding({
            ...existing,
            applicantId: result.applicantId,
            email: result.email,
          })
        }
        const identity = getApplicantIdentity(result.email)
        saveApplicantIdentity({
          email: result.email,
          applicantName: identity?.applicantName || result.email.split('@')[0] || 'Applicant',
          mobileNumber: identity?.mobileNumber || '',
          cnicNumber: identity?.cnicNumber,
          passportNumber: identity?.passportNumber,
          lastApplicantId: result.applicantId,
        })
      }
      setDone(true)
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to set password. The link may have expired.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!token && !done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="rounded-xl border border-[#e4e9f4] bg-white px-6 py-10">
          <h1 className="text-2xl font-bold text-[#071759]">Invalid link</h1>
          <p className="mt-3 text-sm text-[#354a8d]">
            Open the set-password link from your verification email to continue.
          </p>
          <Link
            to="/sign-in"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#0c3cff] px-5 text-sm font-medium text-white hover:bg-[#0934dc]"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="rounded-xl border border-[#e4e9f4] bg-white px-6 py-10">
          <h1 className="text-2xl font-bold text-[#071759]">Password set</h1>
          <p className="mt-3 text-sm text-[#354a8d]">
            Your account{email ? ` for ${email}` : ''} is verified. Sign in to continue your
            application.
          </p>
          <Button
            className="mt-6 h-11 bg-[#0c3cff] hover:bg-[#0934dc]"
            onClick={() => navigate('/sign-in', { replace: true })}
          >
            Continue to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="rounded-xl border border-[#e4e9f4] bg-white px-6 py-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#0c3cff]">SET PASSWORD</p>
        <h1 className="mt-2 text-2xl font-bold text-[#071759]">Create your password</h1>
        <p className="mt-2 text-sm text-[#354a8d]">
          Choose a password to activate your applicant account. Use at least 8 characters with one
          uppercase letter and one number.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#334155]">Password</label>
            <div className="flex h-11 items-center gap-2 rounded-lg border border-[#dce5f6] px-3">
              <Lock className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter a password"
                className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="text-[#64748b]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#334155]">
              Confirm password
            </label>
            <div className="flex h-11 items-center gap-2 rounded-lg border border-[#dce5f6] px-3">
              <Lock className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            disabled={saving}
            className="h-12 w-full bg-[#0c3cff] text-base font-semibold hover:bg-[#0934dc]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Set password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
