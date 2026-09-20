# Med Assurance

Automobile insurance claim management for Moroccan brokers, with a French interface and Arabic client support. Built with Next.js, React, TypeScript and Supabase, deployed on Vercel.

[![CI](https://github.com/READMEmaybe/med-assurance/actions/workflows/checks.yml/badge.svg)](https://github.com/READMEmaybe/med-assurance/actions/workflows/checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- **Broker workspace** in French: home, claims, tasks and account screens, scoped by role (agent, supervisor, admin).
- **Claims management**: searchable table with URL driven search, filter and sort, keyboard accessible preview, and full record pages with client, contract and vehicle context. Notes, dated follow-up tasks with timed undo, and audited status changes.
- **Data safety**: row level security on every business table, a single audited transactional write path with stale edit protection, idempotent notes and tasks.
- **Demo sandbox** at `/demo`: synthetic scenarios, in-memory changes, no backend or login, resets on reload.
- **Client portal**: mobile first French/Arabic interface with RTL, a five step declaration with saved drafts, camera and file uploads, owned case tracking and private document viewing.

## Try it

- Hosted demo (Vercel preview, sign-in may be required): https://med-assurance-kz0yevy4c-readmemaybes-projects.vercel.app/demo
- Local demo: `npm run dev`, then open http://localhost:3000/demo

Screenshots: [home](docs/screenshots/home.png), [claims](docs/screenshots/claims.png), [record](docs/screenshots/record.png). Delivery notes: [docs/fast-track.md](docs/fast-track.md), [docs/client-portal.md](docs/client-portal.md).

## Stack

- Next.js 16 (App Router) and React 19, TypeScript
- Tailwind CSS 4
- Supabase: Postgres with RLS, Auth, Storage
- Vitest (unit tests) and Playwright (end to end tests)
- Vercel for hosting, GitHub Actions for CI

## Requirements

- Node 24.21.0 (see `.nvmrc`)
- npm 12.0.2 (see `engines` in `package.json`)
- Docker, for the local Supabase stack

## Getting started

### Demo only

```sh
npm ci
npm run dev
```

Open http://localhost:3000/demo. No credentials or database needed.

### Full local setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase values.
2. Start the local stack and seed it:

```sh
npm run db:start
npm run db:reset
npm run dev:local
```

`dev:local` reads the local Supabase configuration into the child process without printing or writing keys, and leaves your env files untouched.

Seeded accounts are local only, with password `Demo-local-2026!`:

| Email                                | Scope                                        |
| ------------------------------------ | -------------------------------------------- |
| `supervisor@demo.med-assurance.test` | Six team claims, including unassigned intake |
| `yasmine@demo.med-assurance.test`    | Nadia and Sara                               |
| `salma@demo.med-assurance.test`      | Omar and Imane                               |
| `imane@demo.med-assurance.test`      | Karim                                        |
| `admin@demo.med-assurance.test`      | Organization-wide record access              |
| `client@demo.med-assurance.test`     | Client ownership fixture; no broker access   |

These accounts and passwords are for local development only and are never used for hosted provisioning.

## Environment variables

| Variable                               | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase HTTPS URL, or the loopback URL for local Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key, or the local anon key              |

Public values are baked at build time; rebuild after changing them. Never expose server, admin or AI keys under `NEXT_PUBLIC_`. The app has no service role client.

## Scripts

| Script                                         | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| `npm run dev`                                  | Start the dev server                          |
| `npm run dev:local`                            | Start against the local Supabase stack        |
| `npm run build`                                | Production build                              |
| `npm run check`                                | Format, lint, typecheck, unit tests and build |
| `npm run test` / `npm run test:e2e`            | Unit tests / Playwright end to end tests      |
| `npm run db:start` / `db:stop` / `db:reset`    | Local Supabase lifecycle                      |
| `npm run db:lint`                              | SQL lint on the local database                |
| `npm run db:types` / `db:seed:generate`        | Regenerate TypeScript types / seed SQL        |
| `npm run deploy:preview` / `deploy:production` | Vercel deployments                            |

## Testing

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

The ordinary browser suite covers the public demo and skips the authenticated case unless `TEST_LOCAL_SUPABASE` is set. Against a fresh local seed:

```sh
npm run db:reset
npm run db:lint
npm run db:test
npm run build:local
npm run test:e2e:local
```

The authenticated suite writes synthetic notes and tasks; run `db:reset` afterwards to return to a pristine demo. `db:test` only ever targets the local database.

## Deployment

Vercel is configured in `vercel.json`; the GitHub Actions workflow in `.github/workflows/checks.yml` runs the full check suite on every push and pull request.

- Preview: `npm run deploy:preview`
- Production: push to `main`, or `npm run deploy:production`

Hosted previews are password protected by Vercel; open them with the signed-in Vercel account.

## Project structure

```
app/          routes: broker workspace, auth, client portal, demo sandbox, API
components/   workspace screens, client portal components, shared layout
lib/          domain model, demo adapter, Supabase clients, environment schema
supabase/     local config, migrations, generated seed
scripts/      Supabase helpers, demo provisioning, environment checks
tests/        Vitest unit tests, Playwright end to end tests
docs/         delivery notes and screenshots
```

## Database

- Migrations under `supabase/migrations` are immutable; add follow-up migrations for later changes.
- Every business table uses RLS. Writes go through `mutate_claim`, the audited, caller authorized transactional path.
- After data model changes, regenerate types and seed: `npm run db:types`, `npm run db:seed:generate`.
- Commit migrations and generated types together. Never apply the local auth seed to hosted projects.

## Contributing

Pull requests are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions and the pull request checklist.

## License

[MIT](LICENSE) © 2026 READMEmaybe
