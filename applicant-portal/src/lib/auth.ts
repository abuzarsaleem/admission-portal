export type AuthUser = {
  email: string
  name: string
  userId: string
  tenantId: string
  roles: string[]
  accessToken: string
}

const STORAGE_KEY = 'taleem_applicant_auth_session'

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed.accessToken) return null
    return parsed
  } catch {
    return null
  }
}

export function storeUser(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getAccessToken() {
  return getStoredUser()?.accessToken ?? null
}

export function getDisplayName(email: string) {
  const local = email.split('@')[0] ?? 'User'
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}
