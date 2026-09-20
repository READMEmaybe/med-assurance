# Contributing

Thanks for your interest in Med Assurance. This project is a French broker workspace for automobile insurance claims, with a synthetic demo and a Supabase backed workspace.

## Setup

Prerequisites: Node 24.21.0 (see `.nvmrc`), npm 12.0.2, and Docker for the local Supabase stack.

```sh
git clone https://github.com/READMEmaybe/med-assurance.git
cd med-assurance
npm ci
npm run dev
```

Open http://localhost:3000/demo for the sandbox, or follow the full local setup in the README.

## Development workflow

1. Create a branch from `main`.
2. Make focused, self contained changes.
3. Run `npm run check` and `npm run test:e2e` before pushing.
4. Open a pull request with a clear description. CI runs the same checks on every push.

## Code style

Prettier and ESLint are configured. Run `npm run format` before committing; `npm run lint` must pass with zero warnings and `npm run typecheck` must pass.

## Testing

- Unit tests: `npm test` (Vitest).
- End to end tests: `npx playwright install chromium`, then `npm run test:e2e`.
- Authenticated tests against a local seeded Supabase: `npm run db:reset`, `npm run db:test`, `npm run build:local`, then `npm run test:e2e:local`. These tests write synthetic notes and tasks; run `db:reset` afterwards.
- `npm run check` is the full gate: format, lint, typecheck, unit tests and production build.

## Database changes

- Create migrations with `npx supabase migration new <name>`; never edit applied migrations.
- Apply and inspect locally: `npm run db:reset`, `npm run db:lint`.
- Regenerate TypeScript types after schema changes: `npm run db:types`.
- Synthetic scenario data lives in `lib/demo/scenarios.json`; regenerate the seed with `npm run db:seed:generate` after changing it.
- The local auth seed is for local development only. Never apply it to hosted projects.

## Security notes

- Never commit `.env` values or credentials; `env` files are gitignored except examples.
- Never expose server, admin or AI keys under `NEXT_PUBLIC_`.
- Service keys never reach the application; they stay inside provisioning scripts and process memory.
- Every business table uses RLS. Prefer the existing audited mutation path over new write grants.

## Pull request checklist

- [ ] `npm run check` passes
- [ ] New behavior has unit or end to end coverage where practical
- [ ] Migrations are additive and generated types are committed
- [ ] No secrets or environment values in the diff

## Questions

Open an issue to discuss bugs or ideas before spending time on large changes.
