import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'primary' | 'destructive'
  loading?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'destructive',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden border-[#e1e8f5] p-0 sm:max-w-md"
        showCloseButton={!loading}
      >
        <DialogHeader className="space-y-2 px-6 pt-6 pr-14 pb-5 text-left">
          <DialogTitle className="text-xl font-bold leading-snug text-[#071759]">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-[#6374ab]">{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e4e9f4] px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="h-11 min-w-28 border-[#dce5f6] text-[#354a8d] sm:min-w-24"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className={
              confirmVariant === 'primary'
                ? 'h-11 min-w-28 bg-[#0c3cff] hover:bg-[#0934dc] sm:min-w-24'
                : 'h-11 min-w-28 bg-red-600 hover:bg-red-700 sm:min-w-24'
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
