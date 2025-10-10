# Cleanup Candidates After Bolt → Cursor Migration

This audit looked for files that are no longer referenced anywhere in the
runtime code so they can be safely deleted (or archived) without affecting the
Vite/React app.

## Method

- searched the TypeScript/JavaScript source tree with `rg` to confirm whether a
  file is imported or referenced anywhere else
- double-checked the surrounding context to make sure functionality was truly
  replaced and that nothing is being pulled in dynamically

## Files that can be removed safely

### `src/hooks/useTasks.ts` and `src/hooks/useTasks.test.ts`

- The hook duplicates task state logic that now lives in `AppContext`. The only
  remaining reference is its own unit test, so the hook is dead code after the
  move to context providers.【af4674†L1-L6】【F:src/hooks/useTasks.ts†L1-L160】
- Recommendation: delete both the hook and its test to avoid confusion about
  which task management API should be used.

### `src/utils/taskScheduler-reference.js`

- Legacy Google Apps Script helper that is not imported anywhere in the Vite
  project. It was kept as a reference during early experiments but is no longer
  wired into the app.【46e655†L23-L25】
- Recommendation: remove the file (or move it into an archival folder outside
  the compiled source) so that future refactors do not assume it participates in
  the build.

## Notable keepers

A quick scan confirmed that the following directories are still active and
should **not** be deleted:

- `src/components/…`: every component is referenced by `App.tsx` or a sibling
  component (e.g., `BottomNav`, `DevTools`, `SchedulePage`).【cbac24†L3-L27】
- `src/utils/…`: despite the large number of utilities, they are either invoked
  by `AppContext`, `App.tsx`, or the onboarding route, or covered by unit tests
  that exercise production logic.【673317†L1-L37】【46e655†L11-L22】
- `docs/`: product/design documentation that is still valuable for onboarding
  contributors, even though it is not part of the build process.

Removing the two obsolete code paths above will reduce bundle size slightly,
trim Jest runs, and make it clearer which abstractions are still in play.
