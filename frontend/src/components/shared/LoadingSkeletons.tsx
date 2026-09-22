import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PROGRAMME_SIDEBAR_GRID } from '@/components/intakes/steps/ProgrammeConfigurationSidebar'

export function TableRowsSkeleton({ rows = 6, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <Skeleton
                className={
                  colIndex === 0
                    ? 'h-4 w-8'
                    : colIndex === columns - 1
                      ? 'ml-auto h-8 w-24'
                      : 'h-4 max-w-[160px]'
                }
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function IntakeReviewSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-64" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map(key => (
          <Card key={key} className="border-[#e1e8f5] p-6 shadow-none">
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-4 w-full max-w-[180px]" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
        <div className="border-b border-[#e4e9f4] p-5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-[#e1e8f5] p-5 shadow-none">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-6 w-64" />
              <Skeleton className="mt-2 h-4 w-48" />
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function IntakeFlowSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-8 w-64" />
      <Card className="border-[#e1e8f5] p-6 shadow-none">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i === 5 ? 'sm:col-span-2' : undefined}>
              <Skeleton className="mb-2 h-3 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function DepartmentDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-48" />
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
      </div>
      <Card className="grid gap-0 overflow-hidden border-[#e1e8f5] shadow-none sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-7 w-20" />
          </div>
        ))}
      </Card>
      <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
        <div className="border-b border-[#e4e9f4] p-4">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <table className="w-full text-left text-sm">
          <tbody>
            <TableRowsSkeleton rows={5} columns={6} />
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export function CriteriaFeesStepSkeleton() {
  return (
    <div className={`grid gap-5 ${PROGRAMME_SIDEBAR_GRID}`}>
      <Card className="border-[#e1e8f5] p-4 shadow-none">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mb-2 h-2 w-full rounded-full" />
        <Skeleton className="mt-4 h-10 w-full" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="border-[#e1e8f5] p-5 shadow-none">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </Card>
        <Card className="border-[#e1e8f5] p-5 shadow-none">
          <Skeleton className="mb-4 h-5 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-12 w-full" />
          ))}
        </Card>
      </div>
    </div>
  )
}
