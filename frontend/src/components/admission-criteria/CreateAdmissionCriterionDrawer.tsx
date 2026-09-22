import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { ApiError } from '@/lib/api/client'
import { createGeneralCriterion, updateGeneralCriterion } from '@/lib/api/general-criteria'
import type { CriteriaOperator, CriteriaTypeResponse, GeneralCriterionResponse } from '@/lib/api/types'
import { asText } from '@/lib/catalog-mappers'
import { criteriaOperatorOptions, toApiMandatory } from '@/lib/configuration-mappers'

const REQUIREMENT_MAX = 2000
const NAME_MAX = 150
const UNIT_MAX = 30

type CreateAdmissionCriterionDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  criteriaTypes: CriteriaTypeResponse[]
  criterion?: GeneralCriterionResponse | null
}

type FormState = {
  criteriaTypeId: string
  criteriaName: string
  criteriaRequirement: string
  criteriaOperator: string
  criteriaUnit: string
  mandatory: string
}

type TouchedState = {
  criteriaTypeId: boolean
  criteriaName: boolean
  criteriaRequirement: boolean
  criteriaOperator: boolean
  criteriaUnit: boolean
  mandatory: boolean
}

const initialForm: FormState = {
  criteriaTypeId: '',
  criteriaName: '',
  criteriaRequirement: '',
  criteriaOperator: '',
  criteriaUnit: '',
  mandatory: 'Yes',
}

const initialTouched: TouchedState = {
  criteriaTypeId: false,
  criteriaName: false,
  criteriaRequirement: false,
  criteriaOperator: false,
  criteriaUnit: false,
  mandatory: false,
}

function validateForm(form: FormState, criteriaTypes: CriteriaTypeResponse[]) {
  let criteriaTypeError = ''
  if (!form.criteriaTypeId) criteriaTypeError = 'Please select a criteria type.'
  else if (!criteriaTypes.some(type => type.id === form.criteriaTypeId)) {
    criteriaTypeError = 'Please select a valid criteria type.'
  }

  let criteriaNameError = ''
  if (form.criteriaName.trim().length > NAME_MAX) {
    criteriaNameError = `Name must not exceed ${NAME_MAX} characters.`
  }

  let criteriaRequirementError = ''
  const trimmed = form.criteriaRequirement.trim()
  if (!trimmed) criteriaRequirementError = 'This field is required.'
  else if (trimmed.length < 2) criteriaRequirementError = 'Requirement must be at least 2 characters.'
  else if (trimmed.length > REQUIREMENT_MAX) {
    criteriaRequirementError = `Requirement must not exceed ${REQUIREMENT_MAX} characters.`
  }

  let criteriaUnitError = ''
  if (form.criteriaUnit.trim().length > UNIT_MAX) {
    criteriaUnitError = `Unit must not exceed ${UNIT_MAX} characters.`
  }

  let mandatoryError = ''
  if (!form.mandatory) mandatoryError = 'Please select mandatory status.'

  return {
    criteriaTypeId: criteriaTypeError,
    criteriaName: criteriaNameError,
    criteriaRequirement: criteriaRequirementError,
    criteriaOperator: '',
    criteriaUnit: criteriaUnitError,
    mandatory: mandatoryError,
    isValid:
      !criteriaTypeError &&
      !criteriaNameError &&
      !criteriaRequirementError &&
      !criteriaUnitError &&
      !mandatoryError,
  }
}

export function CreateAdmissionCriterionDrawer({
  open,
  onOpenChange,
  onCreated,
  criteriaTypes,
  criterion = null,
}: CreateAdmissionCriterionDrawerProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [touched, setTouched] = useState<TouchedState>(initialTouched)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(criterion)

  const criteriaTypeOptions = useMemo(
    () =>
      criteriaTypes
        .filter(type => type.status === 'ACTIVE' || type.id === criterion?.criteriaTypeId)
        .map(type => type.name)
        .sort((a, b) => a.localeCompare(b)),
    [criteriaTypes, criterion],
  )

  const operatorOptions = useMemo(
    () => ['', ...criteriaOperatorOptions.map(option => option.label)],
    [],
  )

  const errors = useMemo(() => validateForm(form, criteriaTypes), [form, criteriaTypes])

  useEffect(() => {
    if (!open) return
    if (criterion) {
      setForm({
        criteriaTypeId: criterion.criteriaTypeId,
        criteriaName: asText(criterion.criteriaName),
        criteriaRequirement: criterion.criteriaRequirement,
        criteriaOperator: criterion.criteriaOperator
          ? criteriaOperatorOptions.find(option => option.value === criterion.criteriaOperator)?.label ?? ''
          : '',
        criteriaUnit: asText(criterion.criteriaUnit),
        mandatory: criterion.mandatory ? 'Yes' : 'No',
      })
    } else {
      setForm(initialForm)
    }
    setTouched(initialTouched)
    setSubmitted(false)
  }, [open, criterion])

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

  function selectedCriteriaTypeIdByName(name: string) {
    return criteriaTypes.find(type => type.name === name)?.id ?? ''
  }

  function selectedOperatorValue(label: string): CriteriaOperator | null {
    if (!label) return null
    return criteriaOperatorOptions.find(option => option.label === label)?.value ?? null
  }

  async function handleSubmit() {
    setSubmitted(true)
    setTouched({
      criteriaTypeId: true,
      criteriaName: true,
      criteriaRequirement: true,
      criteriaOperator: true,
      criteriaUnit: true,
      mandatory: true,
    })

    if (!errors.isValid) return

    const payload = {
      criteriaName: form.criteriaName.trim() || null,
      criteriaRequirement: form.criteriaRequirement.trim(),
      criteriaOperator: selectedOperatorValue(form.criteriaOperator),
      criteriaUnit: form.criteriaUnit.trim() || null,
      mandatory: toApiMandatory(form.mandatory),
    }

    setSaving(true)
    try {
      if (isEditing && criterion) {
        await updateGeneralCriterion(criterion.id, payload)
        toast.success('Admission criterion updated')
      } else {
        await createGeneralCriterion({
          criteriaTypeId: form.criteriaTypeId,
          ...payload,
        })
        toast.success('Admission criterion created')
      }
      handleOpenChange(false)
      onCreated?.()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save admission criterion.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const selectedCriteriaTypeName =
    criteriaTypes.find(type => type.id === form.criteriaTypeId)?.name ?? ''

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 border-0 bg-white p-0">
        <SheetHeader className="border-b border-[#e4e9f4] px-6 py-6 pr-14">
          <SheetTitle className="text-xl font-bold text-[#071759]">
            {isEditing ? 'Edit Admission Criterion' : 'Create Admission Criterion'}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm leading-5 text-[#6374ab]">
            {isEditing
              ? 'Update a reusable criteria master record for programme offerings.'
              : 'Add a reusable criteria master record that can be attached to programme offerings.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isEditing ? (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#071759]">Criteria Type</label>
              <Input value={selectedCriteriaTypeName} readOnly className="h-10 border-[#b8c6ed] bg-[#f8faff]" />
              <p className="text-xs text-[#6374ab]">Criteria type cannot be changed after creation.</p>
            </div>
          ) : (
            <SearchSelect
              label="Criteria Type"
              value={selectedCriteriaTypeName}
              onChange={value => {
                setForm({ ...form, criteriaTypeId: selectedCriteriaTypeIdByName(value) })
                markTouched('criteriaTypeId')
              }}
              onBlur={() => markTouched('criteriaTypeId')}
              options={criteriaTypeOptions}
              placeholder="Select criteria type"
              error={showError('criteriaTypeId')}
              helperText={
                !showError('criteriaTypeId') ? 'Controlled type from the criteria types catalogue.' : undefined
              }
            />
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">Criteria Name</label>
            <Input
              value={form.criteriaName}
              onChange={event => setForm({ ...form, criteriaName: event.target.value.slice(0, NAME_MAX) })}
              onBlur={() => markTouched('criteriaName')}
              placeholder="Optional label (e.g. Minimum Percentage)"
              className={`h-10 border-[#b8c6ed] ${showError('criteriaName') ? 'border-red-500' : ''}`}
            />
            {showError('criteriaName') && <p className="text-xs text-red-600">{showError('criteriaName')}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">
              Criteria Requirement <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Textarea
                value={form.criteriaRequirement}
                onChange={event => {
                  const value = event.target.value.slice(0, REQUIREMENT_MAX)
                  setForm({ ...form, criteriaRequirement: value })
                }}
                onBlur={() => markTouched('criteriaRequirement')}
                placeholder="Enter applicant-facing requirement"
                className={`min-h-28 resize-none border-[#b8c6ed] pb-7 ${showError('criteriaRequirement') ? 'border-red-500' : ''}`}
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#6374ab]">
                {form.criteriaRequirement.length}/{REQUIREMENT_MAX}
              </span>
            </div>
            {showError('criteriaRequirement') && (
              <p className="text-xs text-red-600">{showError('criteriaRequirement')}</p>
            )}
          </div>

          <SearchSelect
            label="Operator"
            value={form.criteriaOperator}
            onChange={value => {
              setForm({ ...form, criteriaOperator: value })
              markTouched('criteriaOperator')
            }}
            onBlur={() => markTouched('criteriaOperator')}
            options={operatorOptions}
            placeholder="Select operator (optional)"
            helperText="How the requirement value should be evaluated."
          />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">Unit</label>
            <Input
              value={form.criteriaUnit}
              onChange={event => setForm({ ...form, criteriaUnit: event.target.value.slice(0, UNIT_MAX) })}
              onBlur={() => markTouched('criteriaUnit')}
              placeholder="Optional unit (e.g. PERCENTAGE)"
              className={`h-10 border-[#b8c6ed] ${showError('criteriaUnit') ? 'border-red-500' : ''}`}
            />
            {showError('criteriaUnit') && <p className="text-xs text-red-600">{showError('criteriaUnit')}</p>}
          </div>

          <SearchSelect
            label="Mandatory"
            value={form.mandatory}
            onChange={value => {
              setForm({ ...form, mandatory: value })
              markTouched('mandatory')
            }}
            onBlur={() => markTouched('mandatory')}
            options={['Yes', 'No']}
            placeholder="Select mandatory status"
            error={showError('mandatory')}
            helperText={!showError('mandatory') ? 'Whether this criterion is mandatory for admission.' : undefined}
          />
        </div>

        <SheetFooter className="flex-row gap-3 border-t border-[#e4e9f4] px-6 py-5">
          <Button variant="outline" className="h-11 flex-1 border-[#dce5f6] text-[#354a8d]" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button className="h-11 flex-1 bg-[#0c3cff] hover:bg-[#0934dc]" onClick={handleSubmit} disabled={saving}>
            {saving ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Criterion'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
