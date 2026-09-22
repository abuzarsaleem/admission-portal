import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatusRadioGroup } from '@/components/shared/StatusRadioGroup'
import { ApiError } from '@/lib/api/client'
import { createGeneralFee, updateGeneralFee } from '@/lib/api/general-fees'
import type { FeeTypeResponse, GeneralFeeResponse } from '@/lib/api/types'
import { formatFeeTypeLabel, toApiFeeStatus, toUiFeeStatus, type UiFeeStatus } from '@/lib/configuration-mappers'

const currencyOptions = ['PKR', 'USD', 'GBP'] as const

type CreateApplicationFeeDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  feeTypes: FeeTypeResponse[]
  fee?: GeneralFeeResponse | null
}

type FormState = {
  feeType: string
  amount: string
  currency: string
  status: UiFeeStatus
}

type TouchedState = {
  feeType: boolean
  amount: boolean
  currency: boolean
}

const initialForm: FormState = {
  feeType: '',
  amount: '',
  currency: 'PKR',
  status: 'Active',
}

const initialTouched: TouchedState = {
  feeType: false,
  amount: false,
  currency: false,
}

function validateForm(form: FormState, feeTypes: FeeTypeResponse[]) {
  let feeTypeError = ''
  if (!form.feeType) feeTypeError = 'Please select a fee type.'
  else if (!feeTypes.some(type => type.name === form.feeType)) {
    feeTypeError = 'Please select a valid fee type.'
  }

  let amountError = ''
  const trimmedAmount = form.amount.trim()
  if (!trimmedAmount) amountError = 'This field is required.'
  else if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount.replace(/,/g, ''))) {
    amountError = 'Enter a valid amount (e.g. 5000.00).'
  } else if (Number(trimmedAmount.replace(/,/g, '')) < 0) {
    amountError = 'Amount must be zero or greater.'
  }

  let currencyError = ''
  if (!form.currency) currencyError = 'Please select a currency.'
  else if (form.currency.length !== 3) currencyError = 'Currency must be a 3-letter ISO code.'

  return {
    feeType: feeTypeError,
    amount: amountError,
    currency: currencyError,
    isValid: !feeTypeError && !amountError && !currencyError,
  }
}

export function CreateApplicationFeeDrawer({
  open,
  onOpenChange,
  onCreated,
  feeTypes,
  fee = null,
}: CreateApplicationFeeDrawerProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [touched, setTouched] = useState<TouchedState>(initialTouched)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(fee)

  const feeTypeOptions = useMemo(
    () =>
      feeTypes
        .map(type => type.name)
        .sort((a, b) => a.localeCompare(b))
        .map(name => ({ value: name, label: formatFeeTypeLabel(name) })),
    [feeTypes],
  )

  const errors = useMemo(() => validateForm(form, feeTypes), [form, feeTypes])

  useEffect(() => {
    if (!open) return
    if (fee) {
      setForm({
        feeType: fee.feeType,
        amount: fee.amount,
        currency: fee.currency,
        status: toUiFeeStatus(fee.status),
      })
    } else {
      setForm(initialForm)
    }
    setTouched(initialTouched)
    setSubmitted(false)
  }, [open, fee])

  function showError(field: keyof TouchedState) {
    return (touched[field] || submitted) ? errors[field] : ''
  }

  function resetForm() {
    setForm(initialForm)
    setTouched(initialTouched)
    setSubmitted(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  function markTouched(field: keyof TouchedState) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  async function handleSubmit() {
    setSubmitted(true)
    setTouched({ feeType: true, amount: true, currency: true })

    if (!errors.isValid) return

    const amount = Number(form.amount.trim().replace(/,/g, ''))

    setSaving(true)
    try {
      if (isEditing && fee) {
        await updateGeneralFee(fee.id, {
          amount,
          currency: form.currency,
          status: toApiFeeStatus(form.status),
        })
        toast.success('Application fee updated')
      } else {
        await createGeneralFee({
          feeType: form.feeType,
          amount,
          currency: form.currency,
        })
        toast.success('Application fee created')
      }
      handleOpenChange(false)
      onCreated?.()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save application fee.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 border-0 bg-white p-0">
        <SheetHeader className="border-b border-[#e4e9f4] px-6 py-6 pr-14">
          <SheetTitle className="text-xl font-bold text-[#071759]">
            {isEditing ? 'Edit Application Fee' : 'Create Application Fee'}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm leading-5 text-[#6374ab]">
            {isEditing
              ? 'Update a reusable fee master record for programme offerings.'
              : 'Add a reusable fee master record that can be attached to programme offerings.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isEditing ? (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#071759]">Fee Type</label>
              <Input
                value={formatFeeTypeLabel(form.feeType)}
                readOnly
                className="h-10 border-[#b8c6ed] bg-[#f8faff]"
              />
              <p className="text-xs text-[#6374ab]">Fee type cannot be changed after creation.</p>
            </div>
          ) : (
            <SearchSelect
              label="Fee Type"
              value={form.feeType}
              onChange={value => {
                setForm({ ...form, feeType: value })
                markTouched('feeType')
              }}
              onBlur={() => markTouched('feeType')}
              options={feeTypeOptions.map(option => option.value)}
              placeholder="Select fee type"
              error={showError('feeType')}
              helperText={
                !showError('feeType')
                  ? 'Controlled type from the fee types catalogue (e.g. APPLICATION).'
                  : undefined
              }
            />
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">
              Amount <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.amount}
              onChange={event => setForm({ ...form, amount: event.target.value })}
              onBlur={() => markTouched('amount')}
              placeholder="Enter amount"
              className={`h-10 border-[#b8c6ed] ${showError('amount') ? 'border-red-500' : ''}`}
            />
            {!showError('amount') && (
              <p className="text-xs text-[#6374ab]">Enter fee amount (e.g. 5000.00)</p>
            )}
            {showError('amount') && <p className="text-xs text-red-600">{showError('amount')}</p>}
          </div>

          <SearchSelect
            label="Currency"
            value={form.currency}
            onChange={value => {
              setForm({ ...form, currency: value })
              markTouched('currency')
            }}
            onBlur={() => markTouched('currency')}
            options={[...currencyOptions]}
            error={showError('currency')}
            helperText={!showError('currency') ? '3-letter ISO currency code.' : undefined}
          />

          {isEditing && (
            <StatusRadioGroup
              label="Status"
              value={form.status}
              onChange={value => setForm({ ...form, status: value as UiFeeStatus })}
              options={[
                { value: 'Active', label: 'Active', description: 'Fee is available for use.' },
                { value: 'Inactive', label: 'Inactive', description: 'Fee is hidden from selection.' },
                { value: 'Retired', label: 'Retired', description: 'Fee is retired and no longer used.' },
              ]}
            />
          )}
        </div>

        <SheetFooter className="flex-row gap-3 border-t border-[#e4e9f4] px-6 py-5">
          <Button variant="outline" className="h-11 flex-1 border-[#dce5f6] text-[#354a8d]" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button className="h-11 flex-1 bg-[#0c3cff] hover:bg-[#0934dc]" onClick={handleSubmit} disabled={saving}>
            {saving ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Fee'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
