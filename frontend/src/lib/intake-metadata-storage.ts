type IntakeMetadata = {
  academicYear: string
  intakeType: string
  description: string
}

const STORAGE_KEY = 'intake-flow-metadata'

function readAll(): Record<string, IntakeMetadata> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, IntakeMetadata>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, IntakeMetadata>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function saveIntakeMetadata(intakeId: string, metadata: IntakeMetadata) {
  const all = readAll()
  all[intakeId] = metadata
  writeAll(all)
}

export function loadIntakeMetadata(intakeId: string): IntakeMetadata | null {
  return readAll()[intakeId] ?? null
}
