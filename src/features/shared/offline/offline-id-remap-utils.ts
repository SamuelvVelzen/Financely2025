export function applyIdRemapsToValue(
  value: unknown,
  remaps: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === "string") {
    return remaps.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyIdRemapsToValue(item, remaps));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        applyIdRemapsToValue(nested, remaps),
      ]),
    );
  }
  return value;
}

/** Replace client entity ids embedded in API path segments. */
export function applyIdRemapsToEndpoint(
  endpoint: string,
  remaps: ReadonlyMap<string, string>,
): string {
  let result = endpoint;
  for (const [from, to] of remaps) {
    if (!from || from === to) continue;
    if (result.includes(from)) {
      result = result.split(from).join(to);
    }
  }
  return result;
}
