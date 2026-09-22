import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatAcademicYear, parseAcademicYearStart } from '@/lib/academic-year'
import { cn } from '@/lib/utils'

type AcademicYearFieldProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  label?: string
  required?: boolean
}

export function AcademicYearField({
  value,
  onChange,
  onBlur,
  error,
  label = 'Academic Year',
  required = false,
}: AcademicYearFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const anchorYear = parseAcademicYearStart(value) ?? new Date().getFullYear()
  const [viewStartYear, setViewStartYear] = useState(anchorYear - (anchorYear % 12))

  const yearOptions = useMemo(() => {
    const years: string[] = []
    for (let year = viewStartYear; year < viewStartYear + 12; year += 1) {
      years.push(formatAcademicYear(year))
    }
    return years
  }, [viewStartYear])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onBlur])

  useEffect(() => {
    const startYear = parseAcademicYearStart(value)
    if (startYear !== null) {
      setViewStartYear(startYear - (startYear % 12))
    }
  }, [value])

  function selectYear(startYear: number) {
    onChange(formatAcademicYear(startYear))
    setOpen(false)
    onBlur?.()
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="text-sm font-semibold text-[#071759]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm',
          error ? 'border-red-500' : 'border-[#b8c6ed]',
        )}
      >
        <span className={value ? 'text-[#0f1f4d]' : 'text-[#6374ab]'}>
          {value || 'Select academic year'}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#6374ab]" />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full min-w-[280px] rounded-md border border-[#b8c6ed] bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewStartYear(current => current - 12)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#354a8d] hover:bg-[#f4f7fc]"
              aria-label="Previous years"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-[#071759]">
              {viewStartYear} – {viewStartYear + 11}
            </p>
            <button
              type="button"
              onClick={() => setViewStartYear(current => current + 12)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#354a8d] hover:bg-[#f4f7fc]"
              aria-label="Next years"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {yearOptions.map(option => {
              const startYear = parseAcademicYearStart(option)
              if (startYear === null) return null
              const isSelected = value === option

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectYear(startYear)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-[#0c3cff] bg-[#edf3ff] text-[#0c3cff]'
                      : 'border-[#e4e9f4] bg-white text-[#071759] hover:border-[#c7d9ff] hover:bg-[#f8faff]',
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
