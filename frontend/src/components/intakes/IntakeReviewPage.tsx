import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IntakeStatusBadge } from '@/components/shared/IntakeStatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ReturnIntakeDrawer } from '@/components/intakes/ReturnIntakeDrawer'
import { IntakeReviewSkeleton } from '@/components/shared/LoadingSkeletons'
import { ReviewSubmitStep } from '@/components/intakes/steps/ReviewSubmitStep'
import { ApiError } from '@/lib/api/client'
import { closeIntake, getIntakeReview, publishIntake } from '@/lib/api/intakes'
import { getDepartment } from '@/lib/api/departments'
import { getProgramme } from '@/lib/api/programmes'
import type { IntakeReviewPackage, IntakeStatus } from '@/lib/api/types'
import { loadOfferingConfigurationState } from '@/lib/intake-flow-api'
import { intakeToFlowData } from '@/lib/intake-mappers'
import { loadIntakeMetadata } from '@/lib/intake-metadata-storage'
import { toUiDegreeLevel } from '@/lib/catalog-mappers'
import {
  ensureProgrammeConfigs,
  defaultIntakeFlowData,
  type IntakeFlowData,
  type IntakeProgrammeOption,
  type ProgrammeOfferingState,
} from '@/types/intake-flow'

export function IntakeReviewPage() {
  const { intakeId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState<IntakeFlowData>(defaultIntakeFlowData)
  const [programmes, setProgrammes] = useState<IntakeProgrammeOption[]>([])
  const [review, setReview] = useState<IntakeReviewPackage | null>(null)
  const [intakeStatus, setIntakeStatus] = useState<IntakeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  useEffect(() => {
    async function load() {
      if (!intakeId) return

      setLoading(true)
      setNotFound(false)
      try {
        const reviewPackage = await getIntakeReview(intakeId)
        const programmeOfferings: Record<string, ProgrammeOfferingState> = {}
        for (const offering of reviewPackage.offerings) {
          programmeOfferings[offering.programmeId] = {
            offeringId: offering.offeringId,
            publishedDescription: offering.publishedDescription,
          }
        }

        const selectedProgrammes = reviewPackage.offerings.map(item => item.programmeId)
        const [loaded, programmeResults] = await Promise.all([
          loadOfferingConfigurationState(programmeOfferings),
          Promise.all(selectedProgrammes.map(programmeId => getProgramme(programmeId))),
        ])

        const departmentIds = [...new Set(programmeResults.map(item => item.departmentId))]
        const departmentResults = await Promise.all(
          departmentIds.map(async departmentId => {
            try {
              return await getDepartment(departmentId)
            } catch {
              return null
            }
          }),
        )
        const departmentMap = new Map(
          departmentResults.filter(Boolean).map(department => [department!.id, department!.name]),
        )

        const metadata = loadIntakeMetadata(intakeId)

        setReview(reviewPackage)
        setIntakeStatus(reviewPackage.intake.status)
        setProgrammes(
          programmeResults.map(item => ({
            id: item.id,
            name: item.name,
            code: item.code,
            level: toUiDegreeLevel(item.degreeLevel),
            departmentName: departmentMap.get(item.departmentId) ?? '—',
          })),
        )
        setData({
          ...intakeToFlowData(reviewPackage.intake),
          academicYear: metadata?.academicYear ?? '',
          intakeType: metadata?.intakeType ?? '',
          description: metadata?.description ?? '',
          selectedProgrammes,
          programmeOfferings,
          programmeConfigs: ensureProgrammeConfigs(selectedProgrammes, loaded.configs),
          criteriaLabels: loaded.criteriaLabels,
          feeLabels: loaded.feeLabels,
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
  }, [intakeId])

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
        <IntakeStatusBadge status={intakeStatus} />
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

      <ReviewSubmitStep
        data={data}
        programmes={programmes}
        intakeId={intakeId}
        mode="publication"
        reviewPackage={review}
      />

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
