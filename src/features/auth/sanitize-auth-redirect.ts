const DEFAULT_AUTH_REDIRECT = "/";

/** Subset of TanStack Router `location` used to build a post-auth redirect path. */
export interface IAuthRedirectLocation {
  publicHref?: string;
  href: string;
  pathname: string;
  searchStr: string;
  hash: string;
}

interface ISanitizeAuthRedirectOptions {
  /** When validating absolute URLs (e.g. copied from location.href). */
  origin?: string;
}

function sanitizeRelativePath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (/[\0\\]/.test(path)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return path || DEFAULT_AUTH_REDIRECT;
}

/**
 * Builds a relative path from a TanStack Router location for login `?redirect=`.
 * Use `publicHref` / `href` — `location.search` is a parsed object, not a query string.
 */
export function getAuthRedirectPath(location: IAuthRedirectLocation): string {
  const raw =
    location.publicHref?.trim() ||
    location.href.trim() ||
    `${location.pathname}${location.searchStr}${
      location.hash ? `#${location.hash}` : ""
    }`;

  return sanitizeAuthRedirect(raw);
}

/**
 * Returns a same-origin relative path safe for post-auth redirects.
 * Rejects external URLs, protocol-relative paths, and dangerous schemes.
 */
export function sanitizeAuthRedirect(
  value: string | undefined | null,
  options?: ISanitizeAuthRedirectOptions
): string {
  if (value == null || typeof value !== "string") {
    return DEFAULT_AUTH_REDIRECT;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (trimmed.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return DEFAULT_AUTH_REDIRECT;
    }

    try {
      const url = new URL(trimmed);
      const origin =
        options?.origin ??
        (typeof window !== "undefined" ? window.location.origin : undefined);

      if (!origin || url.origin !== origin) {
        return DEFAULT_AUTH_REDIRECT;
      }

      return sanitizeRelativePath(
        url.pathname + url.search + url.hash
      );
    } catch {
      return DEFAULT_AUTH_REDIRECT;
    }
  }

  if (!trimmed.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return sanitizeRelativePath(trimmed);
}
