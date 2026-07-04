# Agent instructions

Guidance for AI assistants working in this repository.

## React components: one per file

Each `.tsx` / `.jsx` file must define **at most one UI component** — a PascalCase function or const that **returns JSX** (renders UI).

### Do

- Put each component in its own file, named in kebab-case after the component (e.g. `TagList` → `tag-list.tsx`).
- Extract private subcomponents into sibling files and import them.
- Put non-UI logic in `.ts` files or plain functions/hooks (e.g. `formatTagLabel`, `useXxx`, helpers that `return null`).

### Don't

- Define multiple JSX-returning components in the same file.
- Co-locate “helper components” that render UI in the same file as the main export.

### Examples

```tsx
// ❌ tag-list.tsx — multiple UI components
function TagListItem() { return <div />; }
export function TagList() { return <TagListItem />; }

// ✅ tag-list-item.tsx
export function TagListItem() { return <div />; }

// ✅ tag-list.tsx
import { TagListItem } from "./tag-list-item";
export function TagList() { return <TagListItem />; }
```

```tsx
// ✅ table-with-pagination.tsx — logic-only helper is fine in its own file
// reset-page-on-search-change.tsx returns null (side effects only), not a UI component
```

### Compound components

Sub-parts attached to a parent (e.g. `Dropdown.Footer`, `Dropdown.Panel`) still live in **separate files** and are re-exported/assigned on the parent.

## General

- Match existing conventions in the surrounding code (imports, naming, types).
- Keep changes focused; don't refactor unrelated code.
- Only commit when explicitly asked.

## Quality checks

Before finishing a task that changes application code, run the project quality gate and fix any failures you introduced:

```bash
npm run check
```

`check` runs, in order:

| Script | Command | Purpose |
|--------|---------|---------|
| `typecheck` | `tsc --noEmit` | TypeScript compile errors |
| `lint` | `eslint . --max-warnings 0` | ESLint (zero warnings) |
| `test` | `vitest run` | Unit tests |

Use individual scripts when iterating:

- `npm run typecheck` — after TypeScript-only edits
- `npm run lint` — after lint-related fixes
- `npm test` — after logic changes covered by tests

Do not mark implementation work complete while `npm run check` is failing. Report remaining failures if you cannot fix them.

## Installed skills

Project skills live in `.agents/skills/` (see `skills-lock.json`). Read the relevant `SKILL.md` before applying it.

| Skill | When to use |
|-------|-------------|
| [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md) | Writing, reviewing, or refactoring React/Next.js for performance (waterfalls, bundle size, re-renders, data fetching). [skills.sh](https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) |
| [react-best-practices](.agents/skills/react-best-practices/SKILL.md) | Same domain via the Vercel plugin variant; use alongside or when the plugin skill is more relevant. [skills.sh](https://www.skills.sh/vercel-labs/vercel-plugin/react-best-practices) |
| [stitch-react-components](.agents/skills/stitch-react-components/SKILL.md) | Converting Stitch designs to modular React components (requires Stitch MCP). Installed as `stitch::react-components`. [skills.sh](https://www.skills.sh/google-labs-code/stitch-skills/react:components) |
| [typescript-expert](.agents/skills/typescript-expert/SKILL.md) | Complex TypeScript typing, migrations, monorepo/tooling issues, or compiler performance. [skills.sh](https://www.skills.sh/sickn33/antigravity-awesome-skills/typescript-expert) |

Re-install or update skills:

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/vercel-plugin --skill react-best-practices
npx skills add https://github.com/google-labs-code/stitch-skills --skill stitch::react-components
npx skills add https://github.com/sickn33/antigravity-awesome-skills --skill typescript-expert
```
