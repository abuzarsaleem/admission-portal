import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SortableOrderListProps = {
  items: { id: string; label: string; detail?: string }[]
  onMove: (id: string, direction: 'up' | 'down') => void
  emptyMessage?: string
}

export function SortableOrderList({ items, onMove, emptyMessage = 'No items selected.' }: SortableOrderListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-[#6374ab]">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-[#eef2f9] rounded-lg border border-[#e1e8f5]">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 bg-white px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg">
          <GripVertical className="h-4 w-4 shrink-0 text-[#b8c6ed]" aria-hidden />
          <span className="w-6 shrink-0 text-xs font-semibold text-[#6374ab]">{index + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#071759]">{item.label}</p>
            {item.detail && <p className="truncate text-xs text-[#6374ab]">{item.detail}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="h-8 w-8 border-[#dce5f6]"
              disabled={index === 0}
              onClick={() => onMove(item.id, 'up')}
              aria-label={`Move ${item.label} up`}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="h-8 w-8 border-[#dce5f6]"
              disabled={index === items.length - 1}
              onClick={() => onMove(item.id, 'down')}
              aria-label={`Move ${item.label} down`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function moveOrderedId(ids: string[], id: string, direction: 'up' | 'down'): string[] {
  const index = ids.indexOf(id)
  if (index === -1) return ids
  const swapIndex = direction === 'up' ? index - 1 : index + 1
  if (swapIndex < 0 || swapIndex >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  return next
}
