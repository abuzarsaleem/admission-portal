const DEFAULT_APPLICANT_PORTAL_ORIGIN = 'http://localhost:5174';

export function applicantPortalOrigin(): string {
  const raw =
    process.env.APPLICANT_PORTAL_URL ?? DEFAULT_APPLICANT_PORTAL_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_APPLICANT_PORTAL_ORIGIN;
  }
}

export function applicantPortalLink(
  path: string,
  query?: Record<string, string>,
): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(normalized, `${applicantPortalOrigin()}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
