import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TableRowActionsProps = {
  viewTo?: string
  onEdit?: () => void
  onDelete?: () => void
  deleteLabel?: string
  disableEdit?: boolean
  disableDelete?: boolean
}

const iconButtonClass =
  'size-7 border-[#dce5f6] text-[#354a8d] shadow-none hover:bg-[#f8faff] disabled:opacity-40'

export function TableRowActions({
  viewTo,
  onEdit,
  onDelete,
  deleteLabel = 'Deactivate',
  disableEdit = false,
  disableDelete = false,
}: TableRowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {viewTo && (
        <Button
          size="icon-sm"
          variant="outline"
          className={iconButtonClass}
          aria-label="View details"
          render={<Link to={viewTo} />}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className={iconButtonClass}
          aria-label="Edit"
          disabled={disableEdit}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className={`${iconButtonClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
          aria-label={deleteLabel}
          disabled={disableDelete}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export const clickableTableRowClass = 'cursor-pointer transition-colors hover:bg-[#f4f7fc]'

export function stopRowClickPropagation(event: MouseEvent) {
  event.stopPropagation()
}
