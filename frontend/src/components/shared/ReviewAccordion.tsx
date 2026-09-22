import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ReviewAccordionItemProps = {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export function ReviewAccordionItem({ title, subtitle, open, onToggle, children }: ReviewAccordionItemProps) {
  return (
    <div className="border-b border-[#e1e8f5] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#071759]">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-[#6374ab]">{subtitle}</p>}
        </div>
        <ChevronDown
          className={cn('mt-0.5 h-5 w-5 shrink-0 text-[#6374ab] transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  )
}

type ReviewAccordionProps = {
  title: string
  children: ReactNode
}

export function ReviewAccordion({ title, children }: ReviewAccordionProps) {
  return (
    <div className="rounded-xl border border-[#e1e8f5] bg-white p-6 shadow-none">
      <h2 className="text-lg font-bold text-[#071759]">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  )
}
