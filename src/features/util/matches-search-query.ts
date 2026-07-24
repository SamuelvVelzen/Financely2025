/**
 * Case-insensitive substring match across optional string parts.
 * Empty/whitespace query matches everything.
 */
export function matchesSearchQuery(
  query: string,
  ...parts: (string | null | undefined)[]
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return parts.some((part) => part?.toLowerCase().includes(normalizedQuery));
}
