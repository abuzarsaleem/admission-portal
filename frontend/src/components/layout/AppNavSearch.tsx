import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { appNavItems } from '@/data/app-nav'
import { cn } from '@/lib/utils'

export function AppNavSearch() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return appNavItems
    return appNavItems.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.to.toLowerCase().includes(q),
    )
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectItem(to: string) {
    navigate(to)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function handleKeyNav(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(current => Math.min(current + 1, Math.max(filtered.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(current => Math.max(current - 1, 0))
      return
    }
    if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault()
      selectItem(filtered[activeIndex].to)
    }
  }

  return (
    <div ref={containerRef} className="relative hidden w-125 sm:block">
      <div
        className={cn(
          'flex items-center gap-3 rounded-md bg-[#f1f5fb] px-3 py-2',
          open && 'ring-2 ring-[#0c3cff]/25',
        )}
      >
        <Search className="h-5 w-5 shrink-0 text-[#142b73]" />
        <input
          ref={inputRef}
          value={query}
          onChange={event => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyNav}
          placeholder="Search pages..."
          className="h-auto w-full border-0 bg-transparent p-0 text-sm text-[#071759] outline-none placeholder:text-[#30478d]"
          aria-label="Search sidebar pages"
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-[#dce5f6] bg-white shadow-xl">
          <p className="border-b border-[#e4e9f4] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#6374ab]">
            Sidebar pages only
          </p>
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[#6374ab]">No matching page in the sidebar.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {filtered.map((item, index) => {
                const Icon = item.icon
                const isActive = index === activeIndex
                return (
                  <li key={item.to}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectItem(item.to)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                        isActive ? 'bg-[#edf3ff] text-[#0c3cff]' : 'text-[#071759] hover:bg-[#f8faff]',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 font-medium">{item.label}</span>
                      <span className="text-xs text-[#6374ab]">{item.section}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
