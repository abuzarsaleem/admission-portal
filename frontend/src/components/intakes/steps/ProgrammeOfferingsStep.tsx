import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchSelect } from '@/components/shared/SearchSelect'
import type { IntakeFlowData, IntakeProgrammeOption } from '@/types/intake-flow'

type ProgrammeOfferingsStepProps = {
  data: IntakeFlowData
  onChange: (data: IntakeFlowData) => void
  programmes: IntakeProgrammeOption[]
  showErrors: boolean
  selectionError?: string
}

export function ProgrammeOfferingsStep({
  data,
  onChange,
  programmes,
  showErrors,
  selectionError,
}: ProgrammeOfferingsStepProps) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All')

  const departmentFilterOptions = useMemo(() => {
    const names = [
      ...new Set(programmes.map(programme => programme.departmentName).filter(name => name && name !== '—')),
    ].sort((a, b) => a.localeCompare(b))
    return ['All', ...names]
  }, [programmes])

  const filtered = useMemo(
    () =>
      programmes.filter(programme => {
        const matchesQuery = `${programme.name} ${programme.code} ${programme.departmentName}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const matchesDepartment = department === 'All' || programme.departmentName === department
        return matchesQuery && matchesDepartment
      }),
    [programmes, query, department],
  )

  function toggleProgramme(programmeId: string) {
    const selected = data.selectedProgrammes.includes(programmeId)
      ? data.selectedProgrammes.filter(id => id !== programmeId)
      : [...data.selectedProgrammes, programmeId]
    onChange({ ...data, selectedProgrammes: selected })
  }

  function toggleAll() {
    const allIds = filtered.map(programme => programme.id)
    const allSelected = allIds.every(id => data.selectedProgrammes.includes(id))
    onChange({
      ...data,
      selectedProgrammes: allSelected
        ? data.selectedProgrammes.filter(id => !allIds.includes(id))
        : [...new Set([...data.selectedProgrammes, ...allIds])],
    })
  }

  return (
    <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
      <div className="border-b border-[#e4e9f4] p-6">
        <h2 className="text-lg font-bold text-[#071759]">Select Programmes</h2>
        <p className="mt-1 text-sm text-[#6374ab]">Select the programmes that will be available in this intake.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-[#f1f5fb] px-3 sm:max-w-md">
            <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
            <Input
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search programmes..."
            />
          </div>
          <div className="w-full sm:w-64">
            <SearchSelect
              variant="filter"
              label="Department"
              value={department}
              onChange={setDepartment}
              options={departmentFilterOptions}
              required={false}
            />
          </div>
        </div>
        {showErrors && selectionError && <p className="mt-2 text-xs text-red-600">{selectionError}</p>}
      </div>

      <div className="overflow-x-auto py-3">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f4f7fc] text-xs font-bold">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every(programme => data.selectedProgrammes.includes(programme.id))}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-[#b8c6ed] accent-[#0c3cff]"
                />
              </th>
              <th className="px-4 py-3">Programme Name</th>
              <th className="px-4 py-3">Programme Code</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Department</th>
            </tr>
          </thead>
          <tbody>
            {programmes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6374ab]">
                  No active programmes found.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6374ab]">
                  No programmes match your search or department filter.
                </td>
              </tr>
            ) : (
              filtered.map(programme => (
                <tr key={programme.id}>
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={data.selectedProgrammes.includes(programme.id)}
                      onChange={() => toggleProgramme(programme.id)}
                      className="h-4 w-4 rounded border-[#b8c6ed] accent-[#0c3cff]"
                    />
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#071759]">{programme.name}</td>
                  <td className="px-4 py-3.5 text-[#19316f]">{programme.code}</td>
                  <td className="px-4 py-3.5 text-[#19316f]">{programme.level}</td>
                  <td className="px-4 py-3.5 text-[#354a8d]">{programme.departmentName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[#e4e9f4] px-4 py-3 text-sm text-[#354a8d]">
        Showing 1 to {filtered.length} of {programmes.length} programmes · {data.selectedProgrammes.length} selected
      </div>
    </Card>
  )
}
