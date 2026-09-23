import type { ApplicantWindowStatus } from '@/lib/api/types'

export function getIntakeWindowStatus(
  openAt: string,
  closeAt: string,
  now = new Date(),
): ApplicantWindowStatus {
  const open = new Date(openAt).getTime()
  const close = new Date(closeAt).getTime()
  const current = now.getTime()
  if (current < open) return 'upcoming'
  if (current > close) return 'closed'
  return 'open'
}

export function formatIntakeDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export function formatIntakeDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

export function academicYearFromDate(iso: string) {
  const year = new Date(iso).getFullYear()
  return String(year)
}

export function programmeInitials(code: string, name: string) {
  const fromCode = code.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
  if (fromCode.length >= 2) return fromCode.slice(0, 3)
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

const accentPalette = [
  'bg-[#dbeafe] text-[#1d4ed8]',
  'bg-[#dcfce7] text-[#15803d]',
  'bg-[#ede9fe] text-[#6d28d9]',
  'bg-[#ffedd5] text-[#c2410c]',
  'bg-[#e0f2fe] text-[#0369a1]',
]

export function programmeAccent(index: number) {
  return accentPalette[index % accentPalette.length]
}

export function degreeLevelLabel(level: string) {
  const normalized = level.toLowerCase()
  if (normalized.includes('bachelor') || normalized === 'ug' || normalized.includes('under')) {
    return 'Undergraduate'
  }
  if (normalized.includes('master') || normalized === 'pg' || normalized.includes('post')) {
    return 'Postgraduate'
  }
  if (normalized.includes('doctor')) return 'Doctorate'
  return level
}
