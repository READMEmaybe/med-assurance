import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Explicitly authorized hosted demo target. No service key is saved or printed.
const projectRef = "jrfmolrxiuxmnunauukz";
const url = `https://${projectRef}.supabase.co`;
const credentialsFile = ".env.hosted-accounts.json";
const cli = (args) =>
  JSON.parse(
    execFileSync("supabase", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 4 * 1024 * 1024,
    }),
  );
const projects = cli(["projects", "list"]);
if (
  !projects.projects.some(
    (p) => p.id === projectRef && p.name === "READMEmaybe's Project",
  )
)
  throw new Error("Authorized project not found");
const keys = cli([
  "projects",
  "api-keys",
  "--project-ref",
  projectRef,
  "--reveal",
  "--output",
  "json",
]);
const secret =
  keys.find((key) => key.type === "secret")?.api_key ??
  keys.find((key) => key.name === "service_role")?.api_key;
if (!secret) throw new Error("Missing provisioning access");
const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const scenarios = JSON.parse(readFileSync("lib/demo/scenarios.json", "utf8"));
const names = ["yasmine", "salma", "imane", "supervisor", "admin", "client"];
const profiles = [
  ...scenarios.profiles,
  {
    id: "10000000-0000-4000-8000-000000000006",
    full_name: "Nadia El Mansouri",
    role: "client",
  },
];
const credentials = existsSync(credentialsFile)
  ? JSON.parse(readFileSync(credentialsFile, "utf8"))
  : {
      projectRef,
      projectName: "READMEmaybe's Project",
      url,
      loginUrl:
        "https://med-assurance-kz0yevy4c-readmemaybes-projects.vercel.app/login",
      organizationId: randomUUID(),
      teamId: randomUUID(),
      accounts: profiles.map((p, i) => ({
        fixtureId: p.id,
        full_name: p.full_name,
        role: p.role,
        email: `${names[i]}@demo.med-assurance.test`,
        password: `${randomBytes(18).toString("base64url")}Aa9!`,
        id: null,
      })),
    };
if (credentials.projectRef !== projectRef)
  throw new Error("Credentials belong to another project");
function saveCredentials() {
  writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2) + "\n", {
    mode: 0o600,
  });
  chmodSync(credentialsFile, 0o600);
}
saveCredentials();

const existing = [];
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw new Error(`Cannot inspect Auth users (${error.status})`);
  existing.push(...data.users);
  if (data.users.length < 100) break;
}
for (const account of credentials.accounts) {
  const match = existing.find((u) => u.email === account.email);
  if (match) {
    if (
      match.app_metadata?.provisioned_by !== "med-assurance-hosted-demo" ||
      (account.id && account.id !== match.id)
    )
      throw new Error(
        "An existing account is not owned by this provisioning run",
      );
    account.id = match.id;
  } else {
    if (account.id)
      throw new Error(
        "A previously provisioned account was removed; inspect before continuing",
      );
    const { data, error } = await db.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      app_metadata: { provisioned_by: "med-assurance-hosted-demo" },
    });
    if (error) throw new Error(`Account provisioning failed (${error.status})`);
    account.id = data.user.id;
  }
  saveCredentials();
}

const org = credentials.organizationId;
const team = credentials.teamId;
const mapped = (id) =>
  credentials.accounts.find((a) => a.fixtureId === id)?.id ?? null;
const lines = ["begin;"];
const quote = (value) =>
  value === null
    ? "null"
    : typeof value === "boolean"
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
const insert = (table, row) =>
  lines.push(
    `insert into public.${table} (${Object.keys(row).join(",")}) values (${Object.values(row).map(quote).join(",")}) on conflict do nothing;`,
  );
insert("organizations", { id: org, name: "Med Assurance · Démonstration" });
for (const a of credentials.accounts)
  insert("profiles", {
    id: a.id,
    organization_id: org,
    full_name: a.full_name,
    role: a.role,
  });
insert("teams", {
  id: team,
  organization_id: org,
  name: "Automobile",
  supervisor_id: credentials.accounts.find((a) => a.role === "supervisor").id,
});
for (const a of credentials.accounts.filter((a) => a.role !== "client"))
  insert("team_members", {
    organization_id: org,
    team_id: team,
    profile_id: a.id,
  });
for (const c of scenarios.claims) {
  insert("clients", {
    ...c.client,
    organization_id: org,
    portal_profile_id:
      c.reference === "SIN-26091"
        ? credentials.accounts.find((a) => a.role === "client").id
        : null,
  });
  insert("contracts", {
    ...c.contract,
    organization_id: org,
    client_id: c.client.id,
  });
  const { client, contract, documents, tasks, notes, events, ...record } = c;
  void notes;
  insert("claims", {
    ...record,
    organization_id: org,
    team_id: team,
    client_id: client.id,
    contract_id: contract.id,
    assigned_agent_id: mapped(c.assigned_agent_id),
  });
  for (const d of documents)
    insert("documents", { ...d, organization_id: org, claim_id: c.id });
  for (const t of tasks)
    insert("tasks", {
      ...t,
      organization_id: org,
      claim_id: c.id,
      assigned_to: mapped(t.assigned_to),
      created_by: mapped(c.assigned_agent_id),
    });
  // Deterministic IDs keep repeat provisioning from duplicating seed history.
  for (const [i, event] of events.entries())
    insert("activity_events", {
      ...event,
      id: `40000000-0000-4000-8000-${c.reference.slice(4)}${String(i).padStart(7, "0")}`,
      organization_id: org,
      claim_id: c.id,
      source: "hosted-demo-seed",
    });
}
const { client, contract, documents, tasks, notes, events, ...base } =
  scenarios.claims[0];
void [documents, tasks, notes, events];
insert("claims", {
  ...base,
  id: "20000000-0000-4000-8000-000000000006",
  reference: "SIN-26098",
  organization_id: org,
  team_id: team,
  client_id: client.id,
  contract_id: contract.id,
  assigned_agent_id: null,
  status: "nouveau",
});
lines.push("commit;");
const directory = mkdtempSync(join(tmpdir(), "med-assurance-hosted-seed-"));
try {
  const file = join(directory, "seed.sql");
  writeFileSync(file, lines.join("\n"), { mode: 0o600 });
  cli(["db", "query", "--linked", "--project-ref", projectRef, "--file", file]);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log(
  `Hosted demo provisioned: ${credentials.accounts.length} accounts, six claims. Credentials saved to ignored ${credentialsFile}.`,
);
