import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

type SearchSelectProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: string[]
  required?: boolean
  error?: string
  helperText?: string
  placeholder?: string
  variant?: 'form' | 'filter' | 'inline'
  hideLabel?: boolean
}

export function SearchSelect({
  label = '',
  value,
  onChange,
  onBlur,
  options,
  required = true,
  error,
  helperText,
  placeholder,
  variant = 'form',
  hideLabel = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const isFilter = variant === 'filter'
  const isInline = variant === 'inline'

  return (
    <div ref={containerRef} className={`relative ${hideLabel || isInline ? '' : 'space-y-1.5'}`}>
      {!hideLabel && label && (
        <label className={`font-semibold text-[#071759] ${isFilter ? 'text-xs text-[#40559e]' : 'text-sm'}`}>
          {label}
          {required && !isFilter && <span className="text-red-500"> *</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={onBlur}
        className={`flex h-10 w-full items-center justify-between border bg-white px-3 text-left text-sm ${
          isInline ? 'rounded-md' : 'rounded-md'
        } ${error ? 'border-red-500' : 'border-[#b8c6ed]'}`}
      >
        <span className={value ? 'text-[#0f1f4d]' : 'text-[#6374ab]'}>
          {value || placeholder || (label ? `Select ${label.toLowerCase()}` : 'Select')}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#6374ab] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-[#b8c6ed] bg-white shadow-xl">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No result found.</CommandEmpty>
              <CommandGroup>
                {options.map(option => (
                  <CommandItem
                    key={option}
                    onSelect={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 text-[#0644ff] ${value === option ? 'opacity-100' : 'opacity-0'}`} />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {!error && helperText && <p className="text-xs text-[#6374ab]">{helperText}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
