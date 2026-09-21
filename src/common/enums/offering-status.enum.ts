/** Programme offering lifecycle states aligned with DB check constraint. */
export enum OfferingStatus {
  DRAFT = 'DRAFT',
  CONFIGURED = 'CONFIGURED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export const EDITABLE_OFFERING_STATUSES: OfferingStatus[] = [
  OfferingStatus.DRAFT,
  OfferingStatus.CONFIGURED,
  OfferingStatus.UNDER_REVIEW,
];
