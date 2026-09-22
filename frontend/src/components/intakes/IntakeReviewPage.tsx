import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ReturnIntakeDrawer } from '@/components/intakes/ReturnIntakeDrawer'
import { IntakeReviewSkeleton } from '@/components/shared/LoadingSkeletons'
import { ReviewSubmitStep } from '@/components/intakes/steps/ReviewSubmitStep'
import { ApiError } from '@/lib/api/client'
import { closeIntake, getIntake, publishIntake } from '@/lib/api/intakes'
import { listDepartments } from '@/lib/api/departments'
import { listProgrammes } from '@/lib/api/programmes'
import type { IntakeStatus } from '@/lib/api/types'
import { loadOfferingConfigurationState, loadOfferingState } from '@/lib/intake-flow-api'
import { intakeToFlowData, toUiIntakeStatus } from '@/lib/intake-mappers'
import { loadIntakeMetadata } from '@/lib/intake-metadata-storage'
import { toUiDegreeLevel } from '@/lib/catalog-mappers'
import {
  ensureProgrammeConfigs,
  defaultIntakeFlowData,
  type IntakeFlowData,
  type IntakeProgrammeOption,
} from '@/types/intake-flow'

const statusStyles = {
  Draft: 'bg-[#e3edff] text-[#0644ff]',
  'Under Review': 'bg-[#fef3c7] text-[#b45309]',
  Published: 'bg-[#d9f8eb] text-[#057a55]',
  Closed: 'bg-[#e9eef7] text-[#294477]',
} as const

export function IntakeReviewPage() {
  const { intakeId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState<IntakeFlowData>(defaultIntakeFlowData)
  const [programmes, setProgrammes] = useState<IntakeProgrammeOption[]>([])
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const loadProgrammes = useCallback(async () => {
    const [programmeList, departmentList] = await Promise.all([
      listProgrammes({ page: 1, limit: 100, status: 'ACTIVE' }),
      listDepartments({ page: 1, limit: 100, status: 'ACTIVE' }),
    ])

    setProgrammes(
      programmeList.items.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        level: toUiDegreeLevel(item.degreeLevel),
        departmentName:
          departmentList.items.find(department => department.id === item.departmentId)?.name ?? '—',
      })),
    )
  }, [])

  useEffect(() => {
    async function load() {
      if (!intakeId) return

      setLoading(true)
      setNotFound(false)
      try {
        await loadProgrammes()
        const [intake, offeringState] = await Promise.all([getIntake(intakeId), loadOfferingState(intakeId)])
        const loadedConfigs = await loadOfferingConfigurationState(offeringState.programmeOfferings)
        const metadata = loadIntakeMetadata(intakeId)

        setIntakeStatus(intake.status)
        setData({
          ...intakeToFlowData(intake),
          academicYear: metadata?.academicYear ?? '',
          intakeType: metadata?.intakeType ?? '',
          description: metadata?.description ?? '',
          selectedProgrammes: offeringState.selectedProgrammes,
          programmeOfferings: offeringState.programmeOfferings,
          programmeConfigs: ensureProgrammeConfigs(offeringState.selectedProgrammes, loadedConfigs),
        })
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          setNotFound(true)
        } else {
          const message = error instanceof ApiError ? error.message : 'Failed to load intake review.'
          toast.error(message)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [intakeId, loadProgrammes])

  if (!intakeId) {
    return <Navigate to="/intakes" replace />
  }

  if (notFound) {
    return <Navigate to="/intakes" replace />
  }

  if (loading || !intakeStatus) {
    return <IntakeReviewSkeleton />
  }

  const activeIntakeId = intakeId
  const uiStatus = toUiIntakeStatus(intakeStatus)

  async function handlePublish() {
    setActionLoading(true)
    try {
      await publishIntake(activeIntakeId)
      toast.success('Intake published')
      setPublishOpen(false)
      navigate('/intakes')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to publish intake.'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClose() {
    setActionLoading(true)
    try {
      await closeIntake(activeIntakeId)
      toast.success('Intake closed')
      setCloseOpen(false)
      navigate('/intakes')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to close intake.'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <p className="mb-4 text-sm text-[#40559e]">
        <Link to="/intakes" className="hover:text-[#0644ff]">
          Admissions
        </Link>
        <span className="px-1.5">›</span>
        <Link to="/intakes" className="hover:text-[#0644ff]">
          Intakes
        </Link>
        <span className="px-1.5">›</span>
        <span>Review</span>
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Intake Review</h1>
        <Badge className={`border-0 ${statusStyles[uiStatus]}`}>{uiStatus}</Badge>
        {data.name && (
          <span className="text-lg text-[#6374ab]">
            {data.name}
            {data.code ? ` (${data.code})` : ''}
          </span>
        )}
      </div>

      <p className="mb-6 text-[#43599e]">
        Review the intake configuration below. Publish when ready, return with feedback, or close a published intake.
      </p>

      <ReviewSubmitStep data={data} programmes={programmes} intakeId={intakeId} mode="publication" />

      <div className="sticky bottom-0 -mx-5 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9f4] bg-[#f8faff] px-5 py-4 lg:-mx-7 lg:px-7">
        <Link to="/intakes">
          <Button variant="outline" className="h-11 border-[#dce5f6] px-5 text-[#354a8d]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to intakes
          </Button>
        </Link>

        <div className="flex flex-wrap gap-3">
          {intakeStatus === 'UNDER_REVIEW' && (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-[#dce5f6] px-5 text-[#354a8d]"
                onClick={() => setReturnOpen(true)}
              >
                Return for correction
              </Button>
              <Button type="button" className="h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={() => setPublishOpen(true)}>
                Publish intake
              </Button>
            </>
          )}
          {intakeStatus === 'PUBLISHED' && (
            <Button
              type="button"
              variant="outline"
              className="h-11 border-[#dce5f6] px-5 text-[#354a8d]"
              onClick={() => setCloseOpen(true)}
            >
              Close intake
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={open => !actionLoading && setPublishOpen(open)}
        title="Publish intake?"
        description={`Publishing will make "${data.name}" and all its programme offerings live for applicants.`}
        confirmLabel="Publish"
        confirmVariant="primary"
        loading={actionLoading}
        onConfirm={handlePublish}
      />

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={open => !actionLoading && setCloseOpen(open)}
        title="Close intake?"
        description={`Closing will stop new applications for "${data.name}" and close all associated offerings.`}
        confirmLabel="Close intake"
        loading={actionLoading}
        onConfirm={handleClose}
      />

      <ReturnIntakeDrawer
        open={returnOpen}
        onOpenChange={setReturnOpen}
        intakeId={intakeId}
        intakeName={data.name || 'Intake'}
        onReturned={() => navigate('/intakes')}
      />
    </>
  )
}
