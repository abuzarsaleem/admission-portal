import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { IntakeFlowLayout } from '@/components/intakes/IntakeFlowLayout'
import { IntakeFlowSkeleton } from '@/components/shared/LoadingSkeletons'
import { IntakeInformationStep } from '@/components/intakes/steps/IntakeInformationStep'
import { ApplicationPeriodStep } from '@/components/intakes/steps/ApplicationPeriodStep'
import { ProgrammeOfferingsStep } from '@/components/intakes/steps/ProgrammeOfferingsStep'
import { CriteriaAndFeesStep } from '@/components/intakes/steps/CriteriaAndFeesStep'
import { SupportingInformationStep } from '@/components/intakes/steps/SupportingInformationStep'
import { ReviewSubmitStep } from '@/components/intakes/steps/ReviewSubmitStep'
import { ApiError } from '@/lib/api/client'
import {
  createIntake,
  getIntake,
  setApplicationWindow,
  submitIntakeForReview,
  updateIntake,
} from '@/lib/api/intakes'
import { listDepartments } from '@/lib/api/departments'
import { listProgrammes } from '@/lib/api/programmes'
import {
  loadOfferingConfigurationState,
  loadOfferingState,
  syncCriteriaAndFees,
  syncProgrammeOfferings,
  syncSupportingInformation,
} from '@/lib/intake-flow-api'
import {
  combineDateAndTime,
  getPlaceholderApplicationWindow,
  intakeToFlowData,
  isValidIntakeCode,
} from '@/lib/intake-mappers'
import { loadIntakeMetadata, saveIntakeMetadata } from '@/lib/intake-metadata-storage'
import { toUiDegreeLevel } from '@/lib/catalog-mappers'
import {
  ensureProgrammeConfigs,
  ensureSupportingInfoReviewed,
  defaultIntakeFlowData,
  type IntakeFlowData,
  type IntakeProgrammeOption,
} from '@/types/intake-flow'
import {
  getStepIndex,
  getStepSlug,
  intakeSteps,
  resolveStepSlug,
} from '@/data/intakes-data'

function validateStep(step: number, data: IntakeFlowData) {
  const errors: Record<string, string> = {}

  if (step === 0) {
    const trimmedName = data.name.trim()
    if (!trimmedName) errors.name = 'This field is required.'
    else if (trimmedName.length < 3) errors.name = 'Intake name must be at least 3 characters.'

    const trimmedCode = data.code.trim()
    if (!trimmedCode) errors.code = 'This field is required.'
    else if (!isValidIntakeCode(trimmedCode)) {
      errors.code = 'Code must start with a letter or number and use letters, numbers, dots, hyphens, or underscores.'
    }
  }

  if (step === 1) {
    if (!data.opensDate) errors.opensDate = 'Please select a start date.'
    if (!data.closesDate) errors.closesDate = 'Please select an end date.'
    else if (data.opensDate && data.closesDate < data.opensDate) {
      errors.closesDate = 'Closing date must be after opening date.'
    } else if (data.opensDate && data.closesDate === data.opensDate) {
      const opensAt = combineDateAndTime(data.opensDate, data.opensTime)
      const closesAt = combineDateAndTime(data.closesDate, data.closesTime)
      if (closesAt <= opensAt) {
        errors.closesDate = 'Closing date/time must be after opening date/time.'
      }
    }
  }

  if (step === 2 && data.selectedProgrammes.length === 0) {
    errors.selectedProgrammes = 'Select at least one programme.'
  }

  if (step === 3) {
    const incomplete = data.selectedProgrammes.filter(programmeId => {
      const config = data.programmeConfigs[programmeId]
      return !config?.criteriaFeesSaved
    })
    if (incomplete.length > 0) {
      errors.programmeConfigs = 'Save criteria and fees configuration for every selected programme.'
    }
  }

  if (step === 4) {
    for (const programmeId of data.selectedProgrammes) {
      const items = (data.programmeConfigs[programmeId]?.supportingInfo ?? []).filter(item => !item.removed)
      for (const item of items) {
        if (item.title.trim().length < 3) {
          errors.supportingInfo = 'Each supporting information item needs a title of at least 3 characters.'
          break
        }
        if (item.content.trim().length < 5) {
          errors.supportingInfo = 'Each supporting information item needs content of at least 5 characters.'
          break
        }
      }
      if (errors.supportingInfo) break
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 }
}

const stepSaveMessages = [
  'Intake information saved',
  'Application period saved',
  'Programme offerings saved',
  'Criteria and fees saved',
  'Supporting information saved',
]

function getFlowBasePath(mode: 'create' | 'configure', intakeId?: string) {
  return mode === 'create' ? '/intakes/create' : `/intakes/${intakeId}/configure`
}

function serializeFlowData(data: IntakeFlowData) {
  return JSON.stringify(data)
}

function isStepCompleteOnServer(step: number, data: IntakeFlowData) {
  if (step === 0) return Boolean(data.intakeId)
  if (step === 1) return Boolean(data.opensDate && data.closesDate)
  if (step === 2) {
    return (
      data.selectedProgrammes.length > 0 &&
      data.selectedProgrammes.every(programmeId => Boolean(data.programmeOfferings[programmeId]?.offeringId))
    )
  }
  if (step === 3) {
    return data.selectedProgrammes.every(programmeId => data.programmeConfigs[programmeId]?.criteriaFeesSaved)
  }
  if (step === 4) {
    return data.selectedProgrammes.every(programmeId => data.programmeConfigs[programmeId]?.criteriaFeesSaved)
  }
  return true
}

function canContinueWithoutSave(mode: 'create' | 'configure', step: number, data: IntakeFlowData, savedSnapshot: string | null) {
  if (mode !== 'configure') return false
  if (!savedSnapshot) return false
  if (serializeFlowData(data) !== savedSnapshot) return false
  return isStepCompleteOnServer(step, data)
}

export function IntakeFlowPage({ mode }: { mode: 'create' | 'configure' }) {
  const { intakeId: routeIntakeId, step: stepSlug } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState<IntakeFlowData>(defaultIntakeFlowData)
  const [programmes, setProgrammes] = useState<IntakeProgrammeOption[]>([])
  const [loading, setLoading] = useState(mode === 'configure')
  const [notFound, setNotFound] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const basePath = getFlowBasePath(mode, routeIntakeId)
  const resolvedSlug = stepSlug ? resolveStepSlug(stepSlug) : undefined
  const currentStep = stepSlug ? getStepIndex(stepSlug) : -1

  const loadProgrammes = useCallback(async () => {
    try {
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
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load programmes.'
      toast.error(message)
      setProgrammes([])
    }
  }, [])

  useEffect(() => {
    loadProgrammes()
  }, [loadProgrammes])

  useEffect(() => {
    async function loadIntake() {
      if (mode !== 'configure' || !routeIntakeId) return

      setLoading(true)
      setNotFound(false)
      try {
        const [intake, offeringState] = await Promise.all([
          getIntake(routeIntakeId),
          loadOfferingState(routeIntakeId),
        ])

        const loadedConfigs = await loadOfferingConfigurationState(offeringState.programmeOfferings)

        const metadata = loadIntakeMetadata(routeIntakeId)

        const loadedData: IntakeFlowData = {
          ...intakeToFlowData(intake),
          academicYear: metadata?.academicYear ?? '',
          intakeType: metadata?.intakeType ?? '',
          description: metadata?.description ?? '',
          selectedProgrammes: offeringState.selectedProgrammes,
          programmeOfferings: offeringState.programmeOfferings,
          programmeConfigs: ensureProgrammeConfigs(offeringState.selectedProgrammes, loadedConfigs),
        }
        setData(loadedData)
        setSavedSnapshot(serializeFlowData(loadedData))
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          setNotFound(true)
        } else {
          const message = error instanceof ApiError ? error.message : 'Failed to load intake.'
          toast.error(message)
        }
      } finally {
        setLoading(false)
      }
    }

    loadIntake()
  }, [mode, routeIntakeId])

  const validation = useMemo(() => validateStep(currentStep, data), [currentStep, data])
  const showErrors = submitted

  if (stepSlug && resolvedSlug && resolvedSlug !== stepSlug) {
    return <Navigate to={`${basePath}/${resolvedSlug}`} replace />
  }

  if (currentStep < 0) {
    return <Navigate to={`${basePath}/${intakeSteps[0].slug}`} replace />
  }

  if (mode === 'configure' && notFound) {
    return <Navigate to="/intakes" replace />
  }

  if (loading) {
    return <IntakeFlowSkeleton />
  }

  function goToStep(index: number, nextIntakeId?: string) {
    const path = getFlowBasePath(nextIntakeId ? 'configure' : mode, nextIntakeId ?? routeIntakeId)
    navigate(`${path}/${getStepSlug(index)}`)
    setSubmitted(false)
  }

  function markTouched(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function handleDataChange(next: IntakeFlowData) {
    setData({
      ...next,
      programmeConfigs: ensureProgrammeConfigs(next.selectedProgrammes, next.programmeConfigs),
    })
  }

  function getActiveIntakeId() {
    return data.intakeId ?? routeIntakeId ?? null
  }

  async function persistIntakeInformation(): Promise<string> {
    const payload = {
      intakeName: data.name.trim(),
      intakeCode: data.code.trim(),
    }

    if (data.intakeId) {
      await updateIntake(data.intakeId, payload)
      saveIntakeMetadata(data.intakeId, {
        academicYear: data.academicYear,
        intakeType: data.intakeType,
        description: data.description,
      })
      return data.intakeId
    }

    const created = await createIntake({
      ...payload,
      ...getPlaceholderApplicationWindow(),
    })
    saveIntakeMetadata(created.id, {
      academicYear: data.academicYear,
      intakeType: data.intakeType,
      description: data.description,
    })
    setData(prev => ({ ...prev, intakeId: created.id }))
    return created.id
  }

  async function persistApplicationWindow(intakeId: string) {
    await setApplicationWindow(intakeId, {
      applicationOpenAt: combineDateAndTime(data.opensDate, data.opensTime),
      applicationCloseAt: combineDateAndTime(data.closesDate, data.closesTime),
    })
  }

  function markCurrentDataSaved(nextData: IntakeFlowData = data) {
    setSavedSnapshot(serializeFlowData(nextData))
  }

  async function persistCurrentStep(options: { advance?: boolean } = {}): Promise<IntakeFlowData> {
    if (currentStep === 0) {
      const wasNewIntake = !getActiveIntakeId()
      const intakeId = await persistIntakeInformation()

      if (wasNewIntake) {
        const nextStep = options.advance ? 1 : 0
        const nextData = { ...data, intakeId }
        setData(nextData)
        markCurrentDataSaved(nextData)
        navigate(`/intakes/${intakeId}/configure/${getStepSlug(nextStep)}`, { replace: !options.advance })
        return nextData
      }

      markCurrentDataSaved()
      if (options.advance) goToStep(1)
      return data
    }

    if (currentStep === 1) {
      const intakeId = getActiveIntakeId()
      if (!intakeId) {
        throw new Error('Intake ID is missing. Save intake information first.')
      }
      await persistApplicationWindow(intakeId)
      markCurrentDataSaved()
      if (options.advance) goToStep(2)
      return data
    }

    if (currentStep === 2) {
      const intakeId = getActiveIntakeId()
      if (!intakeId) {
        throw new Error('Intake ID is missing. Complete the previous steps first.')
      }
      const programmeOfferings = await syncProgrammeOfferings(intakeId, data, programmes)
      const nextData = {
        ...data,
        programmeOfferings,
        programmeConfigs: ensureProgrammeConfigs(data.selectedProgrammes, data.programmeConfigs),
      }
      setData(nextData)
      markCurrentDataSaved(nextData)
      if (options.advance) goToStep(3)
      return nextData
    }

    if (currentStep === 3) {
      const programmeConfigs = await syncCriteriaAndFees(data)
      const nextData = {
        ...data,
        programmeConfigs: ensureProgrammeConfigs(data.selectedProgrammes, programmeConfigs),
      }
      setData(nextData)
      markCurrentDataSaved(nextData)
      if (options.advance) goToStep(4)
      return nextData
    }

    if (currentStep === 4) {
      const reviewedData = ensureSupportingInfoReviewed(data)
      const programmeConfigs = await syncSupportingInformation(reviewedData)
      const nextData = {
        ...reviewedData,
        programmeConfigs: ensureProgrammeConfigs(reviewedData.selectedProgrammes, programmeConfigs),
      }
      setData(nextData)
      markCurrentDataSaved(nextData)
      if (options.advance) goToStep(5)
      return nextData
    }

    return data
  }

  async function handleSave() {
    if (currentStep >= intakeSteps.length - 1) {
      toast.success('Changes saved')
      return
    }

    setSubmitted(true)
    if (!validation.isValid) return

    setSaving(true)
    try {
      await persistCurrentStep()
      toast.success(stepSaveMessages[currentStep] ?? 'Changes saved')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save changes.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const skipSaveOnContinue = canContinueWithoutSave(mode, currentStep, data, savedSnapshot)

  async function handleContinue() {
    setSubmitted(true)
    if (!validation.isValid) return

    if (currentStep >= intakeSteps.length - 1) {
      const intakeId = getActiveIntakeId()
      if (!intakeId) {
        toast.error('Intake ID is missing.')
        return
      }

      setSaving(true)
      try {
        await submitIntakeForReview(intakeId)
        toast.success('Intake submitted for review')
        navigate('/intakes')
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to submit intake for review.'
        toast.error(message)
      } finally {
        setSaving(false)
      }
      return
    }

    if (skipSaveOnContinue) {
      goToStep(currentStep + 1)
      return
    }

    setSaving(true)
    try {
      await persistCurrentStep({ advance: true })
      toast.success(stepSaveMessages[currentStep] ?? 'Saved')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to save and continue.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <IntakeFlowLayout
      mode={mode}
      intakeName={data.name}
      intakeCode={data.code}
      currentStep={currentStep}
      saving={saving}
      onStepClick={index => {
        if (index < currentStep) goToStep(index)
      }}
      onPrevious={() => goToStep(currentStep - 1)}
      onSave={handleSave}
      onContinue={handleContinue}
      isLastStep={currentStep === intakeSteps.length - 1}
      continueLabel={
        skipSaveOnContinue && currentStep < intakeSteps.length - 1 ? 'Continue' : undefined
      }
    >
      {currentStep === 0 && (
        <IntakeInformationStep
          data={data}
          onChange={handleDataChange}
          errors={validation.errors}
          showErrors={showErrors || Object.keys(touched).length > 0}
          onBlur={markTouched}
        />
      )}
      {currentStep === 1 && (
        <ApplicationPeriodStep
          data={data}
          onChange={handleDataChange}
          errors={validation.errors}
          showErrors={showErrors || Object.keys(touched).length > 0}
          onBlur={markTouched}
        />
      )}
      {currentStep === 2 && (
        <ProgrammeOfferingsStep
          data={data}
          onChange={handleDataChange}
          programmes={programmes}
          showErrors={showErrors}
          selectionError={validation.errors.selectedProgrammes}
        />
      )}
      {currentStep === 3 && (
        <CriteriaAndFeesStep
          data={data}
          onChange={handleDataChange}
          programmes={programmes}
          showErrors={showErrors}
          configError={validation.errors.programmeConfigs}
        />
      )}
      {currentStep === 4 && (
        <SupportingInformationStep
          data={data}
          onChange={handleDataChange}
          programmes={programmes}
          showErrors={showErrors}
          configError={validation.errors.supportingInfo}
        />
      )}
      {currentStep === 5 && <ReviewSubmitStep data={data} programmes={programmes} intakeId={getActiveIntakeId()} />}
    </IntakeFlowLayout>
  )
}
