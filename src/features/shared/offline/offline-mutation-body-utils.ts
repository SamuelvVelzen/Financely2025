/** True when a JSON body references an id anywhere (tagId, primaryTagId, etc.). */
export function bodyReferencesEntityId(
  value: unknown,
  entityId: string,
): boolean {
  if (typeof value === "string") {
    return value === entityId;
  }
  if (Array.isArray(value)) {
    return value.some((item) => bodyReferencesEntityId(item, entityId));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((nested) =>
      bodyReferencesEntityId(nested, entityId),
    );
  }
  return false;
}

export function collectEntityIdsFromBody(value: unknown): string[] {
  const ids: string[] = [];
  const visit = (node: unknown) => {
    if (typeof node === "string") {
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          node,
        )
      ) {
        ids.push(node);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const nested of Object.values(node as Record<string, unknown>)) {
        visit(nested);
      }
    }
  };
  visit(value);
  return ids;
}
