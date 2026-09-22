import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/api/client'
import { returnIntakeForCorrection } from '@/lib/api/intakes'

type ReturnIntakeDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  intakeId: string
  intakeName: string
  onReturned: () => void
}

const REASON_MAX = 1000

export function ReturnIntakeDrawer({
  open,
  onOpenChange,
  intakeId,
  intakeName,
  onReturned,
}: ReturnIntakeDrawerProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  async function handleSubmit() {
    const trimmed = reason.trim()
    if (trimmed.length < 3) {
      toast.error('Please provide a reason of at least 3 characters.')
      return
    }

    setSubmitting(true)
    try {
      await returnIntakeForCorrection(intakeId, { reason: trimmed })
      toast.success('Intake returned for correction')
      onOpenChange(false)
      onReturned()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to return intake.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={open => !submitting && onOpenChange(open)}>
      <SheetContent className="w-full sm:max-w-[720px]">
        <SheetHeader className="border-b border-[#e4e9f4] pb-4">
          <SheetTitle className="text-xl font-bold text-[#071759]">Return for correction</SheetTitle>
          <SheetDescription className="text-sm text-[#6374ab]">
            Return <strong>{intakeName}</strong> to the admissions team with feedback on what needs to be fixed.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-4 py-5">
          <label className="mb-1.5 block text-sm font-semibold text-[#071759]">
            Reason for return <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value.slice(0, REASON_MAX))}
            placeholder="Describe what needs to be corrected before this intake can be published..."
            className="min-h-36 resize-none border-[#b8c6ed]"
          />
          <p className="mt-1.5 text-xs text-[#6374ab]">{reason.length}/{REASON_MAX} characters</p>
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-[#e4e9f4]">
          <Button
            type="button"
            variant="outline"
            className="border-[#dce5f6]"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Returning...' : 'Return intake'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
