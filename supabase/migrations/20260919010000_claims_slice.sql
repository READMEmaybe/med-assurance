-- Lean broker slice. Client-facing projections, files and further workflows follow.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null
);
create table public.profiles (
  id uuid primary key references auth.users(id),
  organization_id uuid not null references public.organizations(id),
  full_name text not null,
  role text not null check (role in ('agent', 'supervisor', 'admin', 'client')),
  active boolean not null default true,
  unique (organization_id, id)
);
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id), name text not null,
  supervisor_id uuid,
  unique (organization_id, id),
  foreign key (organization_id, supervisor_id) references public.profiles(organization_id, id)
);
create table public.team_members (
  organization_id uuid not null, team_id uuid not null, profile_id uuid not null,
  primary key (team_id, profile_id),
  foreign key (organization_id, team_id) references public.teams(organization_id, id),
  foreign key (organization_id, profile_id) references public.profiles(organization_id, id)
);
create table public.clients (
  id text primary key, organization_id uuid not null references public.organizations(id),
  full_name text not null, phone text not null, language text not null default 'fr',
  portal_profile_id uuid unique,
  unique (organization_id, id),
  foreign key (organization_id, portal_profile_id) references public.profiles(organization_id, id)
);
create table public.contracts (
  id text primary key, organization_id uuid not null,
  client_id text not null, reference text not null, insurer text not null,
  vehicle text not null, registration text not null, valid_to date not null,
  unique (organization_id, client_id, id),
  foreign key (organization_id, client_id) references public.clients(organization_id, id)
);
create table public.claims (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  reference text not null, client_id text not null, contract_id text not null,
  team_id uuid not null, assigned_agent_id uuid,
  status text not null check (status in ('nouveau','a_traiter','en_cours','en_attente_client','intervention_requise','clos')),
  priority text not null check (priority in ('normale','haute','critique')),
  occurred_at timestamptz not null, city text not null, location text not null,
  statement text not null, statement_language text not null, translation text,
  injury_state text not null check (injury_state in ('none','yes','unknown')),
  vehicle_drivable boolean not null, assistance_status text not null, assistance_source text,
  has_conflict boolean not null default false, duplicate_import boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (organization_id, id), unique (organization_id, reference),
  foreign key (organization_id, client_id) references public.clients(organization_id, id),
  foreign key (organization_id, client_id, contract_id) references public.contracts(organization_id, client_id, id),
  foreign key (organization_id, team_id) references public.teams(organization_id, id),
  foreign key (team_id, assigned_agent_id) references public.team_members(team_id, profile_id)
);
create table public.documents (
  id text primary key, organization_id uuid not null, claim_id uuid not null,
  label text not null, type text not null, status text not null check (status in ('manquant','recu','a_verifier','verifie','rejete')),
  source text not null,
  foreign key (organization_id, claim_id) references public.claims(organization_id, id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, claim_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 200), due_at timestamptz not null,
  completed_at timestamptz, assigned_to uuid, created_by uuid,
  foreign key (organization_id, claim_id) references public.claims(organization_id, id),
  foreign key (organization_id, assigned_to) references public.profiles(organization_id, id),
  foreign key (organization_id, created_by) references public.profiles(organization_id, id)
);
create table public.notes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, claim_id uuid not null,
  body text not null check (length(trim(body)) between 1 and 4000),
  author_id uuid not null, author_name text not null, created_at timestamptz not null default now(),
  foreign key (organization_id, claim_id) references public.claims(organization_id, id),
  foreign key (organization_id, author_id) references public.profiles(organization_id, id)
);
create table public.activity_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, claim_id uuid not null,
  actor_id uuid, actor_name text not null, action text not null, label text not null,
  source text not null default 'broker', before_value jsonb, after_value jsonb,
  created_at timestamptz not null default now(),
  foreign key (organization_id, claim_id) references public.claims(organization_id, id),
  foreign key (organization_id, actor_id) references public.profiles(organization_id, id)
);
create index on public.claims(organization_id, assigned_agent_id);
create index on public.claims(team_id);
create index on public.claims(client_id);
create index on public.claims(contract_id);
create index on public.tasks(claim_id);
create index on public.documents(claim_id);
create index on public.notes(claim_id);
create index on public.activity_events(claim_id, created_at desc);

create function private.staff_org() returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.profiles where id = auth.uid() and active and role <> 'client';
$$;
create function private.can_read_claim(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.claims c join public.profiles p on p.id = auth.uid() and p.active and p.organization_id = c.organization_id
    join public.teams t on t.id = c.team_id
    where c.id = target and (
      p.role = 'admin' or (p.role = 'supervisor' and t.supervisor_id = p.id)
      or (p.role = 'agent' and c.assigned_agent_id = p.id)
    )
  );
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.clients enable row level security;
alter table public.contracts enable row level security;
alter table public.claims enable row level security;
alter table public.documents enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.activity_events enable row level security;
grant select on public.organizations, public.profiles, public.teams, public.team_members, public.clients, public.contracts, public.claims, public.documents, public.tasks, public.notes, public.activity_events to authenticated;
create policy org_read on public.organizations for select to authenticated using (id = private.staff_org());
create policy profile_read on public.profiles for select to authenticated using (id = auth.uid() or (role <> 'client' and organization_id = private.staff_org()));
create policy team_read on public.teams for select to authenticated using (organization_id = private.staff_org());
create policy member_read on public.team_members for select to authenticated using (organization_id = private.staff_org());
create policy claim_read on public.claims for select to authenticated using (private.can_read_claim(id));
create policy client_read on public.clients for select to authenticated using (exists (select 1 from public.claims c where c.client_id = clients.id));
create policy contract_read on public.contracts for select to authenticated using (exists (select 1 from public.claims c where c.contract_id = contracts.id));
create policy doc_read on public.documents for select to authenticated using (private.can_read_claim(claim_id));
create policy task_read on public.tasks for select to authenticated using (private.can_read_claim(claim_id));
create policy note_read on public.notes for select to authenticated using (private.can_read_claim(claim_id));
create policy activity_read on public.activity_events for select to authenticated using (private.can_read_claim(claim_id));

-- The only write entry point. Scope, allowlist, stale-edit checks and audit are one transaction.
-- Request UUIDs make note/task retries idempotent. No direct table writes are granted.
create function public.mutate_claim(p_claim_id uuid, p_kind text, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  c public.claims; actor public.profiles; t public.tasks;
  event_action text; event_label text; before_data jsonb; after_data jsonb;
  value_text text; request_id uuid;
begin
  select * into c from public.claims where id = p_claim_id for update;
  if not found or not private.can_read_claim(p_claim_id) then raise exception 'Access denied' using errcode = '42501'; end if;
  select * into strict actor from public.profiles where id = auth.uid() and active;
  if p_kind = 'status' then
    value_text := p_payload->>'value';
    if value_text is null or value_text not in ('nouveau','a_traiter','en_cours','en_attente_client','intervention_requise','clos') then raise exception 'Invalid status'; end if;
    if c.status is distinct from p_payload->>'expected' then raise exception 'Stale edit' using errcode = '40001'; end if;
    if c.status = value_text then return; end if;
    -- Injury review completion is deliberately not implemented by changing status.
    if c.injury_state <> 'none' and value_text <> 'intervention_requise' then raise exception 'Human review required' using errcode = '23514'; end if;
    update public.claims set status = value_text where id = c.id;
    event_action := 'claim.status.changed'; event_label := 'Statut du dossier modifié';
    before_data := jsonb_build_object('status', c.status); after_data := jsonb_build_object('status', value_text);
  elsif p_kind = 'note' then
    if c.status = 'clos' then raise exception 'Claim closed' using errcode = '23514'; end if;
    value_text := trim(p_payload->>'body'); request_id := (p_payload->>'requestId')::uuid;
    if request_id is null or value_text is null or length(value_text) not between 1 and 4000 then raise exception 'Invalid note'; end if;
    if exists(select 1 from public.notes where id = request_id and claim_id = c.id and author_id = actor.id and body = value_text) then return; end if;
    insert into public.notes(id, organization_id, claim_id, body, author_id, author_name) values (request_id, c.organization_id, c.id, value_text, actor.id, actor.full_name);
    event_action := 'note.created'; event_label := 'Note interne ajoutée'; after_data := jsonb_build_object('note_id', request_id);
  elsif p_kind = 'task_create' then
    if c.status = 'clos' then raise exception 'Claim closed' using errcode = '23514'; end if;
    value_text := trim(p_payload->>'title'); request_id := (p_payload->>'requestId')::uuid;
    if request_id is null or value_text is null or length(value_text) not between 1 and 200 or (p_payload->>'dueAt') is null then raise exception 'Invalid task'; end if;
    if exists(select 1 from public.tasks where id = request_id and claim_id = c.id and created_by = actor.id and title = value_text and due_at = (p_payload->>'dueAt')::timestamptz) then return; end if;
    insert into public.tasks(id, organization_id, claim_id, title, due_at, assigned_to, created_by)
      values (request_id, c.organization_id, c.id, value_text, (p_payload->>'dueAt')::timestamptz, c.assigned_agent_id, actor.id);
    event_action := 'task.created'; event_label := 'Suivi créé : ' || value_text; after_data := jsonb_build_object('task_id', request_id, 'title', value_text);
  elsif p_kind = 'task_toggle' then
    if c.status = 'clos' then raise exception 'Claim closed' using errcode = '23514'; end if;
    select * into t from public.tasks where id = (p_payload->>'taskId')::uuid and claim_id = c.id for update;
    if not found then raise exception 'Access denied' using errcode = '42501'; end if;
    if jsonb_typeof(p_payload->'completed') is distinct from 'boolean' or jsonb_typeof(p_payload->'expectedCompleted') is distinct from 'boolean' then raise exception 'Invalid completion'; end if;
    if (t.completed_at is not null) is distinct from (p_payload->>'expectedCompleted')::boolean then raise exception 'Stale edit' using errcode = '40001'; end if;
    if (t.completed_at is not null) = (p_payload->>'completed')::boolean then return; end if;
    update public.tasks set completed_at = case when (p_payload->>'completed')::boolean then now() else null end where id = t.id;
    event_action := case when (p_payload->>'completed')::boolean then 'task.completed' else 'task.reopened' end;
    event_label := case when (p_payload->>'completed')::boolean then 'Suivi terminé : ' else 'Suivi rouvert : ' end || t.title;
    before_data := jsonb_build_object('task_id', t.id, 'completed', t.completed_at is not null);
    after_data := jsonb_build_object('task_id', t.id, 'completed', (p_payload->>'completed')::boolean);
  else
    raise exception 'Unsupported action';
  end if;
  update public.claims set updated_at = now() where id = c.id;
  insert into public.activity_events(organization_id, claim_id, actor_id, actor_name, action, label, before_value, after_value)
    values(c.organization_id, c.id, actor.id, actor.full_name, event_action, event_label, before_data, after_data);
end;
$$;
revoke all on function public.mutate_claim(uuid, text, jsonb) from public, anon;
grant execute on function public.mutate_claim(uuid, text, jsonb) to authenticated;
