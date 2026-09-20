# First usable broker slice: 2026-09-19

M1 was already complete. At the user's request to prioritize speed and something concrete to demonstrate, this delivery combines the necessary M2 data/auth work with the visible M3 shell and a narrow M4 workflow. The full milestones remain in progress.

## Open the result

[Hosted interactive demo](https://med-assurance-kz0yevy4c-readmemaybes-projects.vercel.app/demo). Vercel preview protection remains enabled; open it with the signed-in Vercel account. Local server: <http://localhost:3000/demo>; persistent login: <http://localhost:3000/login>.

The Vercel build is ready (`dpl_25rYjkPKXxaq5KvzouDGWqALFtZu`). Authenticated CLI requests to `/demo` and the Arabic record both returned HTTP 200 with expected content; `/api/health` returned the expected JSON. Desktop, tablet and mobile screenshots were inspected locally. This is a CLI preview from the working tree; no new GitHub CI run or production release is claimed.

## Delivered

- French home with scoped workload, priority cases and follow-ups.
- Searchable claims table; URL search/filter/sort; native modal preview with keyboard focus restoration; full record pages.
- All five baseline references, client/contract/vehicle context, original Arabic and separate working translation, document states, visible injury/conflict/assistance/duplicate attention.
- Notes, dated follow-up creation, completion/reopening, three independent timed undo notifications, status changes and history. Closed dossiers do not prompt active follow-ups. Injury cases cannot bypass human review by changing status.
- Local Supabase Auth with refreshed sessions, protected pages, organization-consistent foreign keys, RLS and an atomic audited mutation function. Idempotent note/task creation, stale-edit protection and network-failure rollback.
- A public synthetic `/demo` adapter using the same screens. It has in-memory changes only, explicitly resets on reload, and never contacts the business backend.

## Two-minute demonstration

1. Open `/demo`. The operational home shows the five situations and overdue follow-ups.
2. Open **Sinistres**, search **Nadia**, then select the row. Close the preview with Escape and reopen it to show that the search context stays intact.
3. Open the full record. Read the missing-report action, add an internal note, create a dated follow-up, complete it and use **Annuler**.
4. Open **Activité** to see the actions. Open Sara's record to show the preserved Arabic source and human-review attention; Omar's shows the RMA/Sanlam discrepancy.
5. **Réinitialiser** or reload to reset the sandbox. For persistence, use the local seeded supervisor/agent login instead, perform the same actions and reload.

The demo never promises file upload, insurer coverage, conflict resolution or AI functionality that is not implemented. The sidebar includes only the three usable workspaces.

## Verification

Local verification: production build, lint and type checking pass; 17 unit tests pass; 15 browser tests pass across desktop/mobile (the duplicate mobile authenticated case is intentionally skipped); local SQL lint and direct API access checks pass. Database access checks cover anonymous access, both client users, individual agent scope, sibling claims, team and organization isolation, self-promotion/direct-write rejection, immutable audit, disabled active sessions, input rollback, duplicate retry and stale task completion. Browser checks cover the real save/reload flow and an aborted mutation request.

## Deliberately deferred

M2: dedicated insurers/vehicles, client-safe portal projections, task-based grants and CRM ownership, storage/private files, communication/conflict/AI tables and restricted hosted reset. Contract rows hold the minimal insurer/vehicle context until their workflows require separate reference tables. All internal tables deny client access in this slice.

M3: general-purpose component catalogue and profile menu; the implemented forms/table/drawer/toasts are the ones used by the workflow. Desktop/tablet layouts and a usable mobile shell are included.

M4: file upload/open/verify/request, assistance verification, injury review completion, priority/assignment edits. M5 conflict/import actions and M6 communication drafts remain later slices. Existing attention flags are visible without offering incomplete resolution controls.

The current dataset is small and loaded by caller scope. Pagination, live assignment refresh and release-level accessibility/performance audits remain later work. Timestamps display UTC+01 consistently; server and Chromium Morocco timezone databases disagree for one seeded date, so this explicit offset avoids hydration mismatch.

## Hosted backend activation: 2026-09-19

The user authorized **READMEmaybe’s Project**, matching `.env` (`jrfmolrxiuxmnunauukz`). Inspection found no application tables, Auth users, buckets or previous migrations. All three versioned migrations were deployed after a dry run, including explicit grants that make hosted and local table access identical.

Six Auth accounts were created through the Admin API with individually generated passwords and confirmed emails; no messages were sent. Six claim scenarios and related records are now persisted. Credentials are in ignored, mode-0600 `.env.hosted-accounts.json`. Use the supervisor for all six team claims or agent accounts for individual assignments. Hosted passwords differ from the local seed password.

The existing [hosted login](https://med-assurance-kz0yevy4c-readmemaybes-projects.vercel.app/login) already contained the correct public project configuration, so activating its backend required no replacement Vercel deployment. All six API logins and their scopes passed; client internal access and direct profile writes are denied. The actual hosted browser flow passed login, persistent notes/tasks across reload, independent undo, matching audit, logout and protected-route redirect. See [hosted audit screenshot](screenshots/hosted-audit.png). No runtime service key, production environment change or production release was needed.

The changes are in the working tree of the standalone `med-assurance` repository. The preserved legacy app is unchanged. A preview deployment does not push `main` or change the production alias.
