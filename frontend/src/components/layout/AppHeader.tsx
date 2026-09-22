import { ChevronDown, Menu, Search, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/auth'

type AppHeaderProps = {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user } = useAuth()
  const displayName = user?.name ?? 'Admissions Admin'
  const initials = getInitials(displayName) || 'AA'

  return (
    <header className="flex h-17 items-center justify-between border-b border-[#dce5f6] bg-white px-5 lg:px-7">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>
        <div className="hidden w-125 items-center gap-3 rounded-md bg-[#f1f5fb] px-3 py-2 sm:flex">
          <Search className="h-5 w-5 text-[#142b73]" />
          <span className="text-sm text-[#30478d]">Search anything...</span>
          <kbd className="ml-auto rounded border border-[#d6e0f2] bg-white px-2 py-0.5 text-xs">⌘ K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-[#142b73]">
          <Sun className="h-5 w-5" />
        </Button>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#bcc7ff] font-bold text-[#123bd9]">
          {initials}
        </div>
        <span className="hidden font-semibold sm:block">{displayName}</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </header>
  )
}
