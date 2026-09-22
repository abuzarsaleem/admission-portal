const ACADEMIC_YEAR_PATTERN = /^(\d{4})-(\d{4})$/

export function formatAcademicYear(startYear: number) {
  return `${startYear}-${startYear + 1}`
}

export function parseAcademicYearStart(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const rangeMatch = trimmed.match(ACADEMIC_YEAR_PATTERN)
  if (rangeMatch) {
    const start = Number(rangeMatch[1])
    const end = Number(rangeMatch[2])
    if (end === start + 1) return start
    return null
  }

  if (/^\d{4}$/.test(trimmed)) {
    return Number(trimmed)
  }

  return null
}

export function normalizeAcademicYear(value: string) {
  const startYear = parseAcademicYearStart(value)
  return startYear === null ? '' : formatAcademicYear(startYear)
}

export function buildAcademicYearOptions(anchorYear = new Date().getFullYear(), before = 5, after = 10) {
  const years: string[] = []
  for (let year = anchorYear - before; year <= anchorYear + after; year += 1) {
    years.push(formatAcademicYear(year))
  }
  return years
}
