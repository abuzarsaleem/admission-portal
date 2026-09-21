/** ADM-F000 permission catalogue codes (business authorization). */
export const AdmissionsPermissions = {
  INTAKE_CREATE: 'admissions.intake.create',
  INTAKE_UPDATE: 'admissions.intake.update',
  INTAKE_SUBMIT_REVIEW: 'admissions.intake.submit_review',
  INTAKE_REVIEW: 'admissions.intake.review',
  INTAKE_PUBLISH: 'admissions.intake.publish',
  OFFERING_MANAGE: 'admissions.offering.manage',
  CRITERIA_MANAGE: 'admissions.criteria.manage',
  FEE_MANAGE: 'admissions.fee.manage',
  SUPPORTING_INFO_MANAGE: 'admissions.supporting_info.manage',
} as const;

export type AdmissionsPermission =
  (typeof AdmissionsPermissions)[keyof typeof AdmissionsPermissions];
