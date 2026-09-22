import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ApiError } from '@/lib/api/client'
import { loginWithApi } from '@/lib/api/auth'
import {
  clearStoredUser,
  getDisplayName,
  getStoredUser,
  roleToDisplayName,
  storeUser,
  type AuthUser,
} from '@/lib/auth'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      return { ok: false as const, message: 'Email address is required.' }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { ok: false as const, message: 'Enter a valid email address.' }
    }
    if (!password) {
      return { ok: false as const, message: 'Password is required.' }
    }

    try {
      const data = await loginWithApi({ email: trimmedEmail, password })

      const nextUser: AuthUser = {
        email: data.email,
        name: roleToDisplayName(data.roles) || getDisplayName(data.email) || 'Admissions Admin',
        userId: data.user_id,
        tenantId: data.tenant_id,
        roles: data.roles,
        accessToken: data.access_token,
      }

      storeUser(nextUser)
      setUser(nextUser)
      return { ok: true as const }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'IAM_LOGIN_FAILED') {
          return { ok: false as const, message: 'Invalid email or password.' }
        }
        return { ok: false as const, message: error.message }
      }

      return { ok: false as const, message: 'Unable to sign in. Please try again.' }
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user?.accessToken,
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
