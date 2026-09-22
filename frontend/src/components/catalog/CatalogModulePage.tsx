import { useMemo, useState } from 'react'
import { Check, CircleDollarSign, MoreHorizontal, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Field } from '@/components/catalog/Field'
import { Metric } from '@/components/catalog/Metric'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { catalogData, getCatalogModule } from '@/data/catalog-data'
import type { ModuleKey } from '@/types/catalog'

type CatalogModulePageProps = {
  moduleKey: ModuleKey
}

const metricConfig: Record<ModuleKey, { total: string; active: string; inactive: string; activeLabel?: string; totalLabel?: string }> = {
  Departments: { total: '12', active: '11', inactive: '1' },
  Programmes: { total: '48', active: '42', inactive: '6' },
  'Admission criteria': { total: '18', active: '14', inactive: '4', activeLabel: 'Mandatory Criteria', totalLabel: 'Criteria' },
  'Application fees': { total: '8', active: '6', inactive: '2', totalLabel: 'Fee Types', activeLabel: 'Active Fee Types' },
}

export function CatalogModulePage({ moduleKey }: CatalogModulePageProps) {
  const config = getCatalogModule(moduleKey)
  const [drawer, setDrawer] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    selection: '',
    amount: '',
    currency: 'PKR - Pakistani Rupee',
    state: 'Active',
  })

  const rows = useMemo(
    () =>
      catalogData[moduleKey].filter(
        row =>
          (status === 'All' || row.status === status) &&
          `${row.name} ${row.code}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [moduleKey, query, status],
  )

  const needsSelection = moduleKey !== 'Departments'
  const errors = {
    name: form.name ? '' : 'This field is required.',
    code: moduleKey === 'Admission criteria' || form.code ? '' : 'This field is required.',
    description: form.description ? '' : 'This field is required.',
    selection: !needsSelection || form.selection ? '' : 'Please select an option.',
  }
  const valid = !errors.name && !errors.code && !errors.description && !errors.selection

  const metrics = metricConfig[moduleKey]
  const pageTitle = config.pageTitle ?? config.name
  const totalLabel = metrics.totalLabel ?? config.name
  const activeLabel = metrics.activeLabel ?? `Active ${config.name === 'Application fees' ? 'Fee Types' : config.name}`
  const inactiveLabel = `Inactive ${config.name === 'Application fees' ? 'Fee Types' : config.name}`

  function save() {
    setSubmitted(true)
    if (valid) {
      setDrawer(false)
      setForm({ name: '', code: '', description: '', selection: '', amount: '', currency: 'PKR - Pakistani Rupee', state: 'Active' })
      toast.success(`${config.action.replace('Create ', '')} created`)
    }
  }

  function openDrawer() {
    setSubmitted(false)
    setDrawer(true)
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-[#40559e]">
            {config.breadcrumbSection} <span className="px-1">›</span> {pageTitle}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="mt-1 text-[#43599e]">{config.description}</p>
        </div>
        <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          {config.action}
        </Button>
      </div>

      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <Metric value={metrics.total} label={`Total ${totalLabel}`} icon={config.icon} />
        <Metric value={metrics.active} label={activeLabel} icon={Check} success />
        <Metric value={metrics.inactive} label={inactiveLabel} icon={CircleDollarSign} />
      </section>

      <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
        <div className="flex flex-wrap gap-4 p-3">
          <div className="flex h-10 w-full max-w-95 items-center gap-2 rounded-md bg-[#f1f5fb] px-3">
            <Search className="h-4 w-4" />
            <Input
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={`Search ${config.name.toLowerCase()}...`}
            />
          </div>
          <div className="ml-auto w-48">
            <SearchSelect label="Status" value={status} onChange={setStatus} options={['All', 'Active', 'Inactive']} required={false} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-215 text-left text-sm">
            <thead className="bg-[#f4f7fc] text-xs font-bold">
              <tr>
                <th className="px-4 py-3">#</th>
                {config.columns.map(column => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.code} className="border-t border-[#e4e9f4]">
                  <td className="px-4 py-3.5">{index + 1}</td>
                  <td className="px-4 py-3.5 font-medium">{row.name}</td>
                  <td className="px-4 py-3.5">{row.code}</td>
                  <td className="px-4 py-3.5 text-[#354a8d]">{row.detail}</td>
                  <td className="px-4 py-3.5">{row.value}</td>
                  <td className="px-4 py-3.5">
                    <Badge className={row.status === 'Active' ? 'border-0 bg-[#d9f8eb] text-[#057a55]' : 'border-0 bg-[#e9eef7] text-[#294477]'}>
                      <span className={`mr-1.5 h-2 w-2 rounded-full ${row.status === 'Active' ? 'bg-[#00a768]' : 'bg-[#31518d]'}`} />
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Button size="sm" variant="ghost" className="text-[#0644ff]">
                      View
                    </Button>
                    <Button size="icon-sm" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between p-4 text-sm text-[#354a8d]">
          <span>
            Showing 1 to {rows.length} of {catalogData[moduleKey].length} {config.name.toLowerCase()}
          </span>
          <div className="flex gap-2">
            <Button size="icon-sm" variant="outline">
              ←
            </Button>
            <Button size="sm" className="bg-[#e3edff] text-[#0644ff] hover:bg-[#dbe7ff]">
              1
            </Button>
            <Button size="icon-sm" variant="outline">
              →
            </Button>
          </div>
        </div>
      </Card>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent className="w-full gap-0 border-0 bg-white p-0">
          <SheetHeader className="border-b border-[#e4e9f4] px-6 py-6">
            <SheetTitle className="text-xl font-bold text-[#071759]">{config.action}</SheetTitle>
            <SheetDescription className="mt-1 leading-5 text-[#43599e]">{config.description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <Field
              label={
                moduleKey === 'Admission criteria'
                  ? 'Criterion Type'
                  : moduleKey === 'Application fees'
                    ? 'Fee Type Name'
                    : `${config.name.slice(0, -1)} Name`
              }
              value={form.name}
              setValue={value => setForm({ ...form, name: value })}
              error={submitted ? errors.name : ''}
              placeholder={`Enter ${config.name.slice(0, -1).toLowerCase()} name`}
            />
            {moduleKey !== 'Admission criteria' && (
              <Field
                label={moduleKey === 'Application fees' ? 'Fee Code' : `${config.name.slice(0, -1)} Code`}
                value={form.code}
                setValue={value => setForm({ ...form, code: value.toUpperCase() })}
                error={submitted ? errors.code : ''}
                placeholder="Enter short code"
              />
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                {moduleKey === 'Admission criteria' ? 'Criteria Requirement' : 'Description'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
                className={`min-h-28 border-[#b8c6ed] ${submitted && errors.description ? 'border-red-500' : ''}`}
                placeholder={
                  moduleKey === 'Admission criteria'
                    ? 'Enter criteria requirement'
                    : `Enter ${config.name.slice(0, -1).toLowerCase()} description`
                }
              />
              {submitted && errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>
            {needsSelection && (
              <SearchSelect
                label={
                  moduleKey === 'Programmes'
                    ? 'Department'
                    : moduleKey === 'Admission criteria'
                      ? 'Programme'
                      : 'Applicable Programme'
                }
                value={form.selection}
                onChange={value => setForm({ ...form, selection: value })}
                options={['Computer Science', 'Business Administration', 'Engineering', 'All programmes']}
                error={submitted ? errors.selection : ''}
              />
            )}
            {moduleKey === 'Application fees' && (
              <>
                <Field
                  label="Default Amount"
                  value={form.amount}
                  setValue={value => setForm({ ...form, amount: value })}
                  optional
                  placeholder="Enter amount"
                />
                <SearchSelect
                  label="Currency"
                  value={form.currency}
                  onChange={value => setForm({ ...form, currency: value })}
                  options={['PKR - Pakistani Rupee', 'USD - US Dollar', 'GBP - Pound Sterling']}
                  required={false}
                />
              </>
            )}
            <SearchSelect
              label="Status"
              value={form.state}
              onChange={value => setForm({ ...form, state: value })}
              options={['Active', 'Inactive']}
            />
          </div>
          <SheetFooter className="flex-row border-t border-[#e4e9f4] px-6 py-5">
            <Button variant="outline" className="flex-1" onClick={() => setDrawer(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-[#0c3cff] hover:bg-[#0934dc]" onClick={save}>
              {config.action}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
