/** Normalize email for intake-scoped uniqueness. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strip separators for CNIC/passport uniqueness. */
export function normalizeIdentity(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;

/**
 * Detect CNIC vs passport from a single registration identity field.
 */
export function splitIdentityDocument(raw: string): {
  cnicNumber: string | null;
  passportNumber: string | null;
  normalizedIdentity: string;
} {
  const trimmed = raw.trim();
  const normalizedIdentity = normalizeIdentity(trimmed);
  if (CNIC_PATTERN.test(trimmed) || /^\d{13}$/.test(normalizedIdentity)) {
    const formatted =
      CNIC_PATTERN.test(trimmed)
        ? trimmed
        : `${normalizedIdentity.slice(0, 5)}-${normalizedIdentity.slice(5, 12)}-${normalizedIdentity.slice(12)}`;
    return {
      cnicNumber: formatted,
      passportNumber: null,
      normalizedIdentity,
    };
  }
  return {
    cnicNumber: null,
    passportNumber: trimmed.toUpperCase(),
    normalizedIdentity,
  };
}

export function buildApplicationReference(
  applicationId: string | number,
  prefix = 'NUKTA',
): string {
  return `${prefix}-${applicationId}`;
}
