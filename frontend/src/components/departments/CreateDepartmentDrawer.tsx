import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/api/client'
import { createDepartment, updateDepartment } from '@/lib/api/departments'
import type { DepartmentResponse } from '@/lib/api/types'
import { asText } from '@/lib/catalog-mappers'

const DESCRIPTION_MAX = 2000

type CreateDepartmentDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  department?: DepartmentResponse | null
}

type FormState = {
  name: string
  code: string
  description: string
}

type TouchedState = {
  name: boolean
  code: boolean
  description: boolean
}

const initialForm: FormState = {
  name: '',
  code: '',
  description: '',
}

const initialTouched: TouchedState = {
  name: false,
  code: false,
  description: false,
}

function validateForm(form: FormState) {
  const trimmedName = form.name.trim()
  const trimmedCode = form.code.trim()
  const trimmedDescription = form.description.trim()

  let nameError = ''
  if (!trimmedName) nameError = 'This field is required.'
  else if (trimmedName.length < 2) nameError = 'Department name must be at least 2 characters.'

  let codeError = ''
  if (!trimmedCode) codeError = 'This field is required.'
  else if (trimmedCode.length < 1 || trimmedCode.length > 100) codeError = 'Code must be between 1 and 100 characters.'
  else if (!/^[A-Z0-9-]+$/i.test(trimmedCode)) codeError = 'Code can only contain letters, numbers, and hyphens.'

  let descriptionError = ''
  if (trimmedDescription.length > DESCRIPTION_MAX) {
    descriptionError = `Description must not exceed ${DESCRIPTION_MAX} characters.`
  }

  return {
    name: nameError,
    code: codeError,
    description: descriptionError,
    isValid: !nameError && !codeError && !descriptionError,
  }
}

export function CreateDepartmentDrawer({
  open,
  onOpenChange,
  onCreated,
  department = null,
}: CreateDepartmentDrawerProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [touched, setTouched] = useState<TouchedState>(initialTouched)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(department)

  const errors = useMemo(() => validateForm(form), [form])

  useEffect(() => {
    if (!open) return
    if (department) {
      setForm({
        name: department.name,
        code: department.code,
        description: asText(department.description),
      })
    } else {
      setForm(initialForm)
    }
    setTouched(initialTouched)
    setSubmitted(false)
  }, [open, department])

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
    setTouched({ name: true, code: true, description: true })

    if (!errors.isValid) return

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
      }

      if (isEditing && department) {
        await updateDepartment(department.id, payload)
        toast.success('Department updated')
      } else {
        await createDepartment(payload)
        toast.success('Department created')
      }
      handleOpenChange(false)
      onCreated?.()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create department.'
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
            {isEditing ? 'Edit Department' : 'Create Department'}
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm leading-5 text-[#6374ab]">
            {isEditing
              ? 'Update department details. Changes apply to all linked programmes.'
              : 'Add a new academic department. Departments can have multiple programmes.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">
              Department Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })}
              onBlur={() => markTouched('name')}
              placeholder="Enter department name"
              className={`h-10 border-[#b8c6ed] ${showError('name') ? 'border-red-500' : ''}`}
            />
            {showError('name') && <p className="text-xs text-red-600">{showError('name')}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">
              Department Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.code}
              onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })}
              onBlur={() => markTouched('code')}
              placeholder="Enter short code (e.g. CS)"
              className={`h-10 border-[#b8c6ed] ${showError('code') ? 'border-red-500' : ''}`}
            />
            {!showError('code') && (
              <p className="text-xs text-[#6374ab]">A unique code for identification (max 100 characters).</p>
            )}
            {showError('code') && <p className="text-xs text-red-600">{showError('code')}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#071759]">Description</label>
            <div className="relative">
              <Textarea
                value={form.description}
                onChange={event => {
                  const value = event.target.value.slice(0, DESCRIPTION_MAX)
                  setForm({ ...form, description: value })
                }}
                onBlur={() => markTouched('description')}
                placeholder="Enter department description"
                className={`min-h-32 resize-none border-[#b8c6ed] pb-7 ${showError('description') ? 'border-red-500' : ''}`}
              />
              <span className="pointer-events-none absolute right-3 bottom-2 text-xs text-[#6374ab]">
                {form.description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            {showError('description') && <p className="text-xs text-red-600">{showError('description')}</p>}
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 border-t border-[#e4e9f4] px-6 py-5">
          <Button variant="outline" className="h-11 flex-1 border-[#dce5f6] text-[#354a8d]" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button className="h-11 flex-1 bg-[#0c3cff] hover:bg-[#0934dc]" onClick={handleSubmit} disabled={saving}>
            {saving ? (isEditing ? 'Saving...' : 'Creating...') : isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
