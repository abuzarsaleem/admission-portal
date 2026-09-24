/** ADM-F002 controlled values for application completion child tables. */

export enum AcademicDocumentType {
  CERTIFICATE = 'CERTIFICATE',
  MARKSHEET = 'MARKSHEET',
  TRANSCRIPT = 'TRANSCRIPT',
}

export enum AcademicDocumentVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum QualificationLevel {
  UNDERGRADUATE = 'UNDERGRADUATE',
  POSTGRADUATE = 'POSTGRADUATE',
  PHD = 'PHD',
}

export enum ApplicationAddressType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export enum ApplicationContactType {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
  EMERGENCY = 'EMERGENCY',
}
