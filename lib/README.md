# Module boundaries

- `domain/claims/`: pure claim vocabulary and deterministic attention/next-action rules.
- `demo/`: checked-in synthetic scenarios and an explicit in-memory sandbox adapter. Never a fallback for failed business queries.
- `workspace.ts`: server-only verified broker identity and caller-scoped Supabase reads. RLS is the direct-request boundary.
- `env/`: public configuration allowlist, no server credentials.
- `supabase/client.ts`: browser client with public key only.
- `supabase/server.ts`: request-scoped server client using caller cookies; cookie writes only in Actions/Route Handlers. `proxy.ts` refreshes sessions.

`app/actions.ts` validates mutations and invokes the transactional `mutate_claim` RPC. All writes are authorized again in Postgres and produce immutable audit records. No service-role client is part of the application. Client-safe portal access, uploads and AI follow in later slices.
