import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const status = JSON.parse(
  execFileSync("supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
assert.match(status.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const client = () =>
  createClient(status.API_URL, status.PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const login = async (name) => {
  const db = client();
  const { error } = await db.auth.signInWithPassword({
    email: `${name}@demo.med-assurance.test`,
    password: "Demo-local-2026!",
  });
  assert.equal(error, null, `Login: ${name}`);
  return db;
};
const sql = (text) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_med-assurance",
      "psql",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atc",
      text,
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
const claimId = "20000000-0000-4000-8000-000000000001";
const otherId = "20000000-0000-4000-8000-000000000002";
const agentId = "10000000-0000-4000-8000-000000000001";
const [agent, supervisor, admin, portal, otherPortal, otherTeam, otherOrg] =
  await Promise.all(
    [
      "yasmine",
      "supervisor",
      "admin",
      "client",
      "other-client",
      "other-agent",
      "other-org",
    ].map(login),
  );
const anon = client();
assert.ok(
  (
    await anon.auth.signUp({
      email: "blocked@demo.med-assurance.test",
      password: "Demo-local-2026!",
    })
  ).error,
  "Signup remains disabled",
);
assert.ok((await anon.from("claims").select("*")).error, "Anonymous denied");
for (const [db, count, label] of [
  [agent, 2, "agent"],
  [supervisor, 6, "supervisor"],
  [admin, 7, "admin"],
  [portal, 0, "client"],
  [otherPortal, 0, "other client"],
  [otherTeam, 1, "other team"],
  [otherOrg, 1, "other org"],
]) {
  const result = await db.from("claims").select("*");
  assert.equal(result.error, null, label);
  assert.equal(result.data.length, count, label);
}
for (const table of [
  "clients",
  "contracts",
  "notes",
  "tasks",
  "documents",
  "activity_events",
]) {
  const result = await portal.from(table).select("*");
  assert.equal(result.error, null);
  assert.deepEqual(result.data, [], `Portal cannot read internal ${table}`);
}
assert.deepEqual(
  (await agent.from("claims").select("*").eq("reference", "SIN-26098")).data,
  [],
  "Related client does not expose sibling claim",
);
assert.equal((await agent.from("clients").select("*")).data.length, 2);
assert.deepEqual(
  (await agent.from("profiles").select("*").eq("role", "client")).data,
  [],
  "Unrelated client identities do not leak through profiles",
);
assert.equal((await agent.from("contracts").select("*")).data.length, 2);
assert.ok(
  (await agent.from("profiles").update({ role: "admin" }).eq("id", agentId))
    .error,
  "No self promotion",
);
assert.ok(
  (
    await admin
      .from("claims")
      .update({ organization_id: "00000000-0000-4000-8000-000000000002" })
      .eq("id", claimId)
  ).error,
  "No direct admin writes",
);
for (const [db, target] of [
  [agent, otherId],
  [portal, claimId],
  [otherPortal, claimId],
  [otherTeam, claimId],
  [otherOrg, claimId],
  [supervisor, "20000000-0000-4000-8000-000000000007"],
]) {
  assert.ok(
    (
      await db.rpc("mutate_claim", {
        p_claim_id: target,
        p_kind: "status",
        p_payload: { value: "clos", expected: "en_attente_client" },
      })
    ).error,
    "Forged scope rejected",
  );
}
const noteId = crypto.randomUUID();
const taskId = crypto.randomUUID();
const before = (
  await agent.from("activity_events").select("id").eq("claim_id", claimId)
).data.length;
const note = {
  p_claim_id: claimId,
  p_kind: "note",
  p_payload: { body: "Vérification automatique du suivi", requestId: noteId },
};
assert.equal((await agent.rpc("mutate_claim", note)).error, null);
assert.equal(
  (await agent.rpc("mutate_claim", note)).error,
  null,
  "Idempotent retry",
);
let events = (
  await agent.from("activity_events").select("*").eq("claim_id", claimId)
).data;
assert.equal(events.length, before + 1);
assert.equal(
  events.find((e) => e.after_value?.note_id === noteId).actor_id,
  agentId,
);
assert.ok(
  (await agent.from("activity_events").delete().eq("claim_id", claimId)).error,
  "Audit immutable",
);
assert.ok(
  (
    await agent.rpc("mutate_claim", {
      ...note,
      p_payload: { requestId: crypto.randomUUID(), body: " " },
    })
  ).error,
  "Invalid note rolled back",
);
assert.equal(
  (await agent.from("activity_events").select("id").eq("claim_id", claimId))
    .data.length,
  before + 1,
);
assert.equal(
  (
    await agent.rpc("mutate_claim", {
      p_claim_id: claimId,
      p_kind: "task_create",
      p_payload: {
        requestId: taskId,
        title: "Test de suivi",
        dueAt: "2026-09-20T16:00:00Z",
      },
    })
  ).error,
  null,
);
assert.equal(
  (
    await agent.rpc("mutate_claim", {
      p_claim_id: claimId,
      p_kind: "task_toggle",
      p_payload: { taskId, completed: true, expectedCompleted: false },
    })
  ).error,
  null,
);
assert.ok(
  (
    await agent.rpc("mutate_claim", {
      p_claim_id: claimId,
      p_kind: "task_toggle",
      p_payload: { taskId, completed: true, expectedCompleted: false },
    })
  ).error,
  "Stale completion rejected",
);
assert.equal(
  (
    await agent.rpc("mutate_claim", {
      p_claim_id: claimId,
      p_kind: "task_toggle",
      p_payload: { taskId, completed: false, expectedCompleted: true },
    })
  ).error,
  null,
);
assert.equal(
  (await agent.from("tasks").select("completed_at").eq("id", taskId).single())
    .data.completed_at,
  null,
);
assert.ok(
  (
    await agent.rpc("mutate_claim", {
      p_claim_id: "20000000-0000-4000-8000-000000000003",
      p_kind: "status",
      p_payload: { value: "clos", expected: "intervention_requise" },
    })
  ).error,
  "Injury cannot be closed without review",
);
try {
  sql(`update public.profiles set active = false where id = '${agentId}'`);
  assert.deepEqual(
    (await agent.from("claims").select("*")).data,
    [],
    "Disabled active session loses access",
  );
  assert.ok((await agent.rpc("mutate_claim", note)).error);
} finally {
  sql(`update public.profiles set active = true where id = '${agentId}'`);
  sql(
    `delete from public.notes where id = '${noteId}'; delete from public.tasks where id = '${taskId}'; delete from public.activity_events where after_value->>'note_id' = '${noteId}' or after_value->>'task_id' = '${taskId}'`,
  );
}
console.log(
  "Access checks passed: anonymous, agents, teams, organizations, clients, escalation, audit, retry, stale edits and disabled sessions.",
);
