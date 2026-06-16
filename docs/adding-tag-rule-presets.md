# Adding Tag Rule Presets

This guide explains how to add new **smart tagging presets** — built-in merchant keyword lists that users can enable per workspace (for example, Dutch supermarkets → Food & Dining).

Presets are **suggest-only**: they pre-fill tags in the UI during transaction create or CSV import review. Tags are never applied without user confirmation.

## Overview

When adding a preset, you:

1. **Add an entry** to `DEFAULT_TAG_RULE_PRESETS` in config
2. **Ensure the target tag exists** in `RECOMMENDED_TAGS` (for color, emoticon, and description when the tag is auto-created)
3. **No database migration** — presets ship in code; enabling a preset copies it into the `TagRule` table for that workspace

## File to edit

**`src/features/tag/config/default-tag-rules.ts`**

## Preset shape

```typescript
export interface IDefaultTagRulePreset {
  id: string;                    // Unique id, e.g. "nl-supermarkets"
  label: string;                 // Shown in UI, e.g. "Dutch supermarkets"
  tagName: string;               // Must match a name in recommended-tags.ts
  transactionType: ITransactionType; // "EXPENSE" | "INCOME"
  keywords: string[];            // Lowercase merchant fragments to match
  priority: number;              // Higher wins when multiple rules match
}
```

### Example

```typescript
{
  id: "nl-supermarkets",
  label: "Dutch supermarkets",
  tagName: "Food & Dining",
  transactionType: "EXPENSE",
  keywords: [
    "albert heijn",
    "ah to go",
    "jumbo",
    "dirk",
    "lidl",
  ],
  priority: 10,
}
```

Append new objects to the `DEFAULT_TAG_RULE_PRESETS` array.

## Target tag metadata (color & icon)

When a user enables a preset, Financely creates the target tag if it does not exist. **Color, emoticon, and description** come from [`recommended-tags.ts`](../src/features/tag/config/recommended-tags.ts) by matching `tagName`.

1. Open `src/features/tag/config/recommended-tags.ts`
2. Add or verify an entry with the same `name` as your preset’s `tagName`

```typescript
{
  name: "Food & Dining",
  transactionType: "EXPENSE",
  emoticon: "🍔",
  color: "#FF6B6B",
  description: "Restaurants, groceries, and food-related expenses",
},
```

If the tag already exists but has no color/emoticon, enabling the preset will **backfill** missing metadata from `RECOMMENDED_TAGS`.

## Keyword tips

Matching uses normalized transaction **names** (lowercase, dates/refs stripped). Keywords are matched with **contains** semantics:

- Use distinctive fragments: `"albert heijn"` not `"ah"` (too broad)
- Include spacing when needed: `"plus "` avoids matching unrelated words
- Prefer lowercase in the preset array (normalization handles case at runtime)
- Test against real bank export descriptions from your target market

## Priority and conflicts

- Higher `priority` wins when multiple rules match the same transaction
- Tie-break order: **USER** > **LEARNED** > **SYSTEM** presets
- Separate winners for primary tag vs other tags (`applyAs` on stored rules; presets default to primary tag)

## What happens when a user clicks “Enable preset”

1. API: `POST /api/v1/:workspaceId/tag-rules/enable-presets` with `{ presetIds: ["your-id"] }`
2. `TagRuleService.enablePresets()`:
   - Skips if a `SYSTEM` rule with the same `label` already exists
   - Resolves `tagName` → tag ID (creates tag with recommended metadata if missing)
   - Inserts a `TagRule` row with `source: SYSTEM`
3. UI refetches rules and tags

No server restart required beyond your normal deploy.

## Optional: custom tag name per preset

The API accepts `tagNameMap` to override the default tag name when enabling:

```json
{
  "presetIds": ["nl-supermarkets"],
  "tagNameMap": {
    "nl-supermarkets": "Groceries"
  }
}
```

The UI currently uses the preset’s default `tagName`; the map is for API/advanced use.

## Testing a new preset

1. Run the app and open **Smart tagging** in the sidebar
2. Enable your preset
3. Confirm the target tag appears under **Tags** with the expected color/icon
4. Confirm the rule appears in the rules list
5. Create a transaction whose name contains a keyword — tag fields should show a suggestion
6. Import a CSV row with a matching merchant name — review step should pre-fill the tag

## File structure

```
src/features/tag/config/
├── default-tag-rules.ts    # Add presets here
└── recommended-tags.ts     # Tag names, colors, emoticons

src/features/tag-rule/
├── services/tag-rule.service.ts   # enablePresets(), matching
└── components/tag-rules-panel.tsx # Presets UI
```

## Related docs

- [Adding a new bank to CSV import](./adding-a-new-bank.md)
