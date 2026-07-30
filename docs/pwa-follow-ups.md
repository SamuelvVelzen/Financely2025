# PWA follow-ups (medium & hard)

Notes for later. Easy items (app shortcuts, iOS install help, update UX) are tracked separately in implementation work.

## Medium

### Badging API
Show a count on the installed app icon (unread notifications and/or pending offline sync).

- Use `navigator.setAppBadge(n)` / `clearAppBadge()` from the client when unread or outbox counts change.
- Support is strong on Chromium; limited/absent on iOS Safari — degrade silently.
- Likely wire from existing unread-count + offline pending-sync indicator sources.

### Stronger offline reads
Prefetch key React Query data for the active workspace so more screens work after a cold start offline.

- On app load / workspace switch, warm queries (transactions list, budgets, tags, splits summary).
- Relies on existing IndexedDB query persistence (`idb-kv` + `persistQueryClient`).
- Balance against bandwidth and stale data; prefer explicit “prepare for offline” or light prefetch of current workspace only.

### File System Access
Use the File System Access API for CSV import/export where supported.

- Chrome/Edge: `showOpenFilePicker` / `showSaveFilePicker`.
- Keep classic `<input type="file">` fallback for Safari/Firefox.
- Integrate with the existing transaction import wizard.

### Share Target API
Allow other apps to share a file (e.g. CSV) into Financely.

- Add `share_target` to `manifest.webmanifest` (action URL + `enctype` / file params).
- Add a route that accepts the shared POST/GET payload and opens the import flow.
- Needs careful handling with TanStack Start routing and auth (user must be signed in).

## Hard

### Background Sync / Periodic Background Sync
Replay the offline mutation outbox even when no Financely tab is open.

- Requires service worker logic that can talk to the same IndexedDB outbox (`financely-offline-mutations`).
- Easy to race with the in-tab `OfflineMutationProcessor` — need a single-flight / lock design.
- `periodicSync` is Chromium-only and permission-gated; plan a graceful no-op elsewhere.

### Push notifications
Server-driven alerts (budget thresholds, split activity, sync failures) that show as OS notifications.

- VAPID keys, push subscription storage per user/device, permission UX.
- Server send path (web-push) tied to existing notification domain.
- Service worker `push` + `notificationclick` handlers; deep-link into the right screen.

### Media Session / widgets
Low priority for a finance app.

- Media Session is aimed at audio/video playback — poor product fit.
- Home-screen widgets are not a portable PWA standard (platform-specific); revisit only if targeting a single OS with a clear widget design.
