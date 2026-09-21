/** Intake lifecycle states aligned with DB check constraint. */
export enum IntakeStatus {
  DRAFT = 'DRAFT',
  CONFIGURED = 'CONFIGURED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export const EDITABLE_INTAKE_STATUSES: IntakeStatus[] = [
  IntakeStatus.DRAFT,
  IntakeStatus.CONFIGURED,
  IntakeStatus.UNDER_REVIEW,
];
