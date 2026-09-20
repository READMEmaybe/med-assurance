-- Client-safe projections and transactional portal writes. Internal claim tables
-- remain staff-only: no portal grants on notes, activity, tasks or claim columns.
alter table public.profiles add column avatar_path text;
alter table public.documents add column storage_path text;
create table public.client_drafts (
  id uuid primary key,
  profile_id uuid not null references public.profiles(id),
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  submitted_claim_id uuid references public.claims(id)
);
alter table public.client_drafts enable row level security;
revoke all on public.client_drafts from public, anon, authenticated;
create index on public.client_drafts(profile_id, updated_at desc);

create function private.portal_client() returns text language sql stable security definer set search_path = '' as $$
  select c.id from public.clients c join public.profiles p
    on p.id = c.portal_profile_id and p.organization_id = c.organization_id
    where p.id = auth.uid() and p.active and p.role = 'client';
$$;
revoke all on function private.portal_client() from public, anon;
grant execute on function private.portal_client() to authenticated;

create function public.portal_workspace() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_client_id text := private.portal_client(); result jsonb;
begin
  if v_client_id is null then raise exception 'Access denied' using errcode = '42501'; end if;
  select jsonb_build_object(
    'profile', (select jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_path', p.avatar_path) from public.profiles p where p.id = auth.uid()),
    'contracts', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'reference', c.reference, 'vehicle', c.vehicle, 'registration', c.registration)) from public.contracts c where c.client_id = v_client_id), '[]'::jsonb),
    'claims', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'reference', c.reference, 'status', c.status,
      'occurred_at', c.occurred_at, 'city', c.city, 'location', c.location,
      'statement', c.statement, 'statement_language', c.statement_language,
      'updated_at', c.updated_at, 'vehicle', k.vehicle, 'registration', k.registration,
      'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'label', d.label, 'type', d.type, 'status', d.status, 'storage_path', d.storage_path) order by d.label) from public.documents d where d.claim_id = c.id), '[]'::jsonb)
    ) order by c.updated_at desc) from public.claims c join public.contracts k on k.id = c.contract_id where c.client_id = v_client_id), '[]'::jsonb),
    'draft', (select jsonb_build_object('id', d.id, 'payload', d.payload) from public.client_drafts d where d.profile_id = auth.uid() and d.submitted_claim_id is null order by d.updated_at desc limit 1)
  ) into result;
  return result;
end;
$$;

create function public.portal_save_draft(p_id uuid, p_payload jsonb) returns void language plpgsql security definer set search_path = '' as $$
begin
  if private.portal_client() is null then raise exception 'Access denied' using errcode = '42501'; end if;
  if p_id is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 25000 then raise exception 'Invalid draft'; end if;
  insert into public.client_drafts(id, profile_id, payload) values(p_id, auth.uid(), p_payload)
  on conflict(id) do update set payload = excluded.payload, updated_at = now()
  where client_drafts.profile_id = auth.uid() and client_drafts.submitted_claim_id is null;
  if not found then raise exception 'Draft unavailable' using errcode = '42501'; end if;
end;
$$;

create function public.portal_submit_claim(p_id uuid, p_payload jsonb) returns text language plpgsql security definer set search_path = '' as $$
declare
  owner public.clients; actor public.profiles; contract public.contracts;
  draft public.client_drafts; team uuid; new_reference text;
  injury text; incident timestamptz; upload record;
begin
  select * into owner from public.clients where id = private.portal_client();
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  select * into strict actor from public.profiles where id = auth.uid();
  -- Serialize retries for the same declaration, including simultaneous submissions.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into draft from public.client_drafts where id = p_id;
  if found and draft.profile_id <> auth.uid() then raise exception 'Access denied' using errcode = '42501'; end if;
  if draft.submitted_claim_id is not null then
    return (select reference from public.claims where id = draft.submitted_claim_id);
  end if;
  perform public.portal_save_draft(p_id, p_payload);
  select * into contract from public.contracts where id = p_payload->>'contractId' and client_id = owner.id and organization_id = owner.organization_id;
  if not found then raise exception 'Invalid contract'; end if;
  select id into team from public.teams where organization_id = owner.organization_id order by id limit 1;
  if team is null then raise exception 'Cabinet unavailable'; end if;
  injury := p_payload->>'injury';
  incident := (p_payload->>'occurredAt')::timestamptz;
  if injury is null or injury not in ('none', 'yes', 'unknown')
    or incident is null or incident > now() + interval '5 minutes'
    or coalesce(length(trim(p_payload->>'city')), 0) not between 1 and 120
    or coalesce(length(trim(p_payload->>'location')), 0) not between 1 and 300
    or coalesce(length(trim(p_payload->>'statement')), 0) not between 10 and 4000
    or coalesce(p_payload->>'language', '') not in ('fr', 'ar')
    or coalesce(p_payload->>'drivable', '') not in ('yes', 'no')
    or p_payload->>'safe' is distinct from 'yes'
    then raise exception 'Invalid declaration'; end if;
  new_reference := 'SIN-' || to_char(now(), 'YYMM') || '-' || upper(substr(replace(p_id::text, '-', ''), 1, 12));
  insert into public.claims(id, organization_id, reference, client_id, contract_id, team_id, status, priority,
    occurred_at, city, location, statement, statement_language, injury_state, vehicle_drivable, assistance_status)
  values(p_id, owner.organization_id, new_reference, owner.id, contract.id, team,
    case when injury <> 'none' then 'intervention_requise' else 'nouveau' end,
    case when injury <> 'none' then 'critique' else 'normale' end,
    incident, trim(p_payload->>'city'), trim(p_payload->>'location'), trim(p_payload->>'statement'), p_payload->>'language', injury,
    p_payload->>'drivable' = 'yes', 'a_verifier');
  insert into public.documents(id, organization_id, claim_id, label, type, status, source) values
    (p_id::text || '-constat', owner.organization_id, p_id, 'Constat amiable', 'constat', 'manquant', 'client'),
    (p_id::text || '-photos', owner.organization_id, p_id, 'Photos du véhicule', 'photos', 'manquant', 'client');
  insert into public.activity_events(organization_id, claim_id, actor_id, actor_name, action, label, source)
    values(owner.organization_id, p_id, actor.id, actor.full_name, 'claim.submitted', 'Déclaration reçue depuis l’espace client', 'client');
  for upload in select key, value from jsonb_each_text(coalesce(p_payload->'files', '{}'::jsonb)) loop
    if upload.key not in ('constat', 'photos') then raise exception 'Invalid document type'; end if;
    perform public.portal_attach_document(p_id, p_id::text || '-' || upload.key, upload.value);
  end loop;
  update public.client_drafts set submitted_claim_id = p_id, updated_at = now() where id = p_id;
  return new_reference;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('client-documents', 'client-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

create function private.portal_file_access(bucket text, path text) returns boolean language sql stable security definer set search_path = '' as $$
  select (private.portal_client() is not null and split_part(path, '/', 1) = auth.uid()::text)
    or (bucket = 'client-documents' and exists(select 1 from public.documents d where d.storage_path = path and private.can_read_claim(d.claim_id)));
$$;
revoke all on function private.portal_file_access(text, text) from public, anon;
grant execute on function private.portal_file_access(text, text) to authenticated;
create policy portal_file_read on storage.objects for select to authenticated
  using (bucket_id in ('client-documents', 'avatars') and private.portal_file_access(bucket_id, name));
create policy portal_file_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('client-documents', 'avatars') and private.portal_client() is not null and (storage.foldername(name))[1] = auth.uid()::text);
-- Uploaded objects are immutable. Replacements use new paths so verified files cannot be overwritten.

create function public.portal_attach_document(p_claim_id uuid, p_document_id text, p_path text) returns void language plpgsql security definer set search_path = '' as $$
declare c public.claims; d public.documents; actor public.profiles;
begin
  select * into c from public.claims where id = p_claim_id and client_id = private.portal_client() for update;
  if not found then raise exception 'Access denied' using errcode = '42501'; end if;
  if c.status = 'clos' then raise exception 'Claim closed'; end if;
  select * into d from public.documents where id = p_document_id and claim_id = c.id for update;
  if not found then raise exception 'Invalid document'; end if;
  if split_part(p_path, '/', 1) is distinct from auth.uid()::text or split_part(p_path, '/', 2) is distinct from c.id::text
    or not exists(select 1 from storage.objects where bucket_id = 'client-documents' and name = p_path)
    then raise exception 'Invalid upload'; end if;
  if d.storage_path = p_path then return; end if;
  if d.status = 'verifie' then raise exception 'Document already verified'; end if;
  select * into strict actor from public.profiles where id = auth.uid();
  update public.documents set storage_path = p_path, status = 'recu', source = 'client' where id = d.id;
  update public.claims set updated_at = now() where id = c.id;
  insert into public.activity_events(organization_id, claim_id, actor_id, actor_name, action, label, source)
    values(c.organization_id, c.id, actor.id, actor.full_name, 'document.received', 'Document reçu : ' || d.label, 'client');
end;
$$;

create function public.portal_update_profile(p_name text, p_avatar text) returns void language plpgsql security definer set search_path = '' as $$
begin
  p_avatar := nullif(p_avatar, '');
  if private.portal_client() is null then raise exception 'Access denied' using errcode = '42501'; end if;
  if p_name is null or length(trim(p_name)) not between 2 and 100 then raise exception 'Invalid name'; end if;
  if p_avatar is not null and (split_part(p_avatar, '/', 1) is distinct from auth.uid()::text or
    not exists(select 1 from storage.objects where bucket_id = 'avatars' and name = p_avatar)) then raise exception 'Invalid avatar'; end if;
  update public.profiles set full_name = trim(p_name), avatar_path = p_avatar where id = auth.uid();
  update public.clients set full_name = trim(p_name) where id = private.portal_client();
end;
$$;
revoke all on function public.portal_workspace(), public.portal_save_draft(uuid, jsonb), public.portal_submit_claim(uuid, jsonb), public.portal_attach_document(uuid, text, text), public.portal_update_profile(text, text) from public, anon;
grant execute on function public.portal_workspace(), public.portal_save_draft(uuid, jsonb), public.portal_submit_claim(uuid, jsonb), public.portal_attach_document(uuid, text, text), public.portal_update_profile(text, text) to authenticated;
