export const SPLIT_MODES = ["equal", "exact", "percent", "shares"] as const;

export type ISplitMode = (typeof SPLIT_MODES)[number];

export function isSplitMode(value: string): value is ISplitMode {
  return (SPLIT_MODES as readonly string[]).includes(value);
}

export function parseSplitMode(value: string): ISplitMode {
  return isSplitMode(value) ? value : "equal";
}
