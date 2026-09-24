const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeIdentity(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function resolveIdentityFields(input: {
  cnicNumber?: string | null;
  passportNumber?: string | null;
}): {
  cnicNumber: string | null;
  passportNumber: string | null;
  normalizedIdentity: string;
} {
  const cnic =
    typeof input.cnicNumber === 'string' && input.cnicNumber.trim()
      ? input.cnicNumber.trim()
      : null;
  const passport =
    typeof input.passportNumber === 'string' && input.passportNumber.trim()
      ? input.passportNumber.trim().toUpperCase()
      : null;

  if (cnic && !CNIC_PATTERN.test(cnic)) {
    throw new Error('cnicNumber must match #####-#######-#');
  }

  if (cnic) {
    return {
      cnicNumber: cnic,
      passportNumber: passport,
      // Prefer CNIC for uniqueness when both are present.
      normalizedIdentity: normalizeIdentity(cnic),
    };
  }

  if (passport) {
    return {
      cnicNumber: null,
      passportNumber: passport,
      normalizedIdentity: normalizeIdentity(passport),
    };
  }

  throw new Error('Either cnicNumber or passportNumber is required');
}

export function buildApplicationReference(
  prefix: string,
  applicationId: string | number,
): string {
  const clean = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NUKTA';
  return `${clean}-${applicationId}`;
}
