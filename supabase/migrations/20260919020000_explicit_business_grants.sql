-- Hosted projects can have more permissive default grants than the local CLI.
-- Keep direct table access identical across environments; all writes use the RPC.
revoke all on table
  public.organizations, public.profiles, public.teams, public.team_members,
  public.clients, public.contracts, public.claims, public.documents,
  public.tasks, public.notes, public.activity_events
from public, anon, authenticated;

grant select on table
  public.organizations, public.profiles, public.teams, public.team_members,
  public.clients, public.contracts, public.claims, public.documents,
  public.tasks, public.notes, public.activity_events
to authenticated;
