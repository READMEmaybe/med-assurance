import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Synthetic, LOCAL ONLY accounts. This seed is used only by `db reset --local`.
const data = JSON.parse(readFileSync("lib/demo/scenarios.json", "utf8"));
const org = "00000000-0000-4000-8000-000000000001";
const team = "00000000-0000-4000-8000-000000000011";
const uid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const uuid = (s) => {
  const hex = createHash("sha256").update(s).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
const quote = (v) =>
  v === null
    ? "null"
    : typeof v === "boolean"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
const lines = [
  "-- Generated from lib/demo/scenarios.json. Seed date: 2026-09-19, UTC+01.",
  "-- Local demo password: Demo-local-2026! Never apply these accounts to a hosted project.",
];
function insert(table, row) {
  lines.push(
    `insert into ${table} (${Object.keys(row).join(", ")}) values (${Object.values(row).map(quote).join(", ")});`,
  );
}
insert("public.organizations", {
  id: org,
  name: "Med Assurance · Démonstration",
});
const emails = [
  "yasmine",
  "salma",
  "imane",
  "supervisor",
  "admin",
  "client",
  "other-agent",
  "other-org",
  "other-client",
];
const otherOrg = "00000000-0000-4000-8000-000000000002";
const otherTeam = "00000000-0000-4000-8000-000000000012";
insert("public.organizations", { id: otherOrg, name: "Cabinet témoin" });
const profiles = [
  ...data.profiles,
  { id: uid(6), full_name: "Nadia El Mansouri", role: "client" },
  { id: uid(7), full_name: "Autre équipe", role: "agent" },
  { id: uid(8), full_name: "Autre organisation", role: "admin" },
  { id: uid(9), full_name: "Autre client", role: "client" },
];
profiles.forEach((p, i) => {
  const email = `${emails[i]}@demo.med-assurance.test`;
  lines.push(
    `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change) values ('00000000-0000-0000-0000-000000000000',${quote(p.id)},'authenticated','authenticated',${quote(email)},extensions.crypt('Demo-local-2026!',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');`,
  );
  lines.push(
    `insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values (${quote(uuid(email))},${quote(p.id)},${quote(p.id)},${quote(JSON.stringify({ sub: p.id, email, email_verified: true }))}::jsonb,'email',now(),now(),now());`,
  );
  insert("public.profiles", {
    ...p,
    organization_id: i === 7 ? otherOrg : org,
  });
});
insert("public.teams", {
  id: team,
  organization_id: org,
  name: "Automobile",
  supervisor_id: uid(4),
});
insert("public.teams", {
  id: otherTeam,
  organization_id: org,
  name: "Équipe témoin",
  supervisor_id: null,
});
insert("public.teams", {
  id: "00000000-0000-4000-8000-000000000013",
  organization_id: otherOrg,
  name: "Cabinet témoin",
  supervisor_id: uid(8),
});
for (let i = 1; i <= 5; i++)
  insert("public.team_members", {
    organization_id: org,
    team_id: team,
    profile_id: uid(i),
  });
insert("public.team_members", {
  organization_id: org,
  team_id: otherTeam,
  profile_id: uid(7),
});
insert("public.team_members", {
  organization_id: otherOrg,
  team_id: "00000000-0000-4000-8000-000000000013",
  profile_id: uid(8),
});
for (const c of data.claims) {
  insert("public.clients", {
    ...c.client,
    organization_id: org,
    portal_profile_id:
      c.reference === "SIN-26091"
        ? uid(6)
        : c.reference === "SIN-26094"
          ? uid(9)
          : null,
  });
  insert("public.contracts", {
    ...c.contract,
    organization_id: org,
    client_id: c.client.id,
  });
  const {
    client,
    contract,
    documents,
    tasks,
    notes: _notes,
    events,
    ...record
  } = c;
  void _notes;
  insert("public.claims", {
    ...record,
    organization_id: org,
    team_id: team,
    client_id: client.id,
    contract_id: contract.id,
  });
  documents.forEach((d) =>
    insert("public.documents", { ...d, organization_id: org, claim_id: c.id }),
  );
  tasks.forEach((t) =>
    insert("public.tasks", {
      ...t,
      organization_id: org,
      claim_id: c.id,
      created_by: c.assigned_agent_id,
    }),
  );
  events.forEach((e) =>
    insert("public.activity_events", {
      ...e,
      id: uuid(e.id),
      organization_id: org,
      claim_id: c.id,
      source: "seed",
    }),
  );
}
// A sibling claim must not leak through access to the same client/contract.
const {
  client,
  contract,
  documents: _d,
  tasks: _t,
  notes: _n,
  events: _e,
  ...base
} = data.claims[0];
void [_d, _t, _n, _e];
for (const [id, reference, teamId, assigned] of [
  [6, "SIN-26098", team, null],
  [7, "TEST-OTHER-TEAM", otherTeam, uid(7)],
]) {
  insert("public.claims", {
    ...base,
    id: `20000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
    reference,
    organization_id: org,
    team_id: teamId,
    assigned_agent_id: assigned,
    client_id: client.id,
    contract_id: contract.id,
    status: "nouveau",
  });
}
insert("public.clients", {
  id: "TEST-CLIENT",
  organization_id: otherOrg,
  full_name: "Client cabinet témoin",
  phone: "-",
  language: "fr",
});
insert("public.contracts", {
  ...contract,
  id: "TEST-CONTRACT",
  organization_id: otherOrg,
  client_id: "TEST-CLIENT",
});
insert("public.claims", {
  ...base,
  id: "20000000-0000-4000-8000-000000000008",
  reference: "TEST-OTHER-ORG",
  organization_id: otherOrg,
  team_id: "00000000-0000-4000-8000-000000000013",
  assigned_agent_id: uid(8),
  client_id: "TEST-CLIENT",
  contract_id: "TEST-CONTRACT",
});
writeFileSync("supabase/seed.sql", lines.join("\n") + "\n");
