import type { ClaimStatus } from "./status";

export type Profile = {
  id: string;
  full_name: string;
  role: "agent" | "supervisor" | "admin" | "client";
};
export type ClaimDocument = {
  storage_path?: string | null;
  id: string;
  label: string;
  type: string;
  status: string;
  source: string;
};
export type ClaimTask = {
  id: string;
  title: string;
  due_at: string;
  completed_at: string | null;
  assigned_to: string | null;
};
export type ClaimNote = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
};
export type ClaimEvent = {
  id: string;
  action: string;
  label: string;
  actor_name: string;
  created_at: string;
};
export type Claim = {
  id: string;
  reference: string;
  status: ClaimStatus;
  priority: "normale" | "haute" | "critique";
  assigned_agent_id: string | null;
  occurred_at: string;
  city: string;
  location: string;
  statement: string;
  statement_language: string;
  translation: string | null;
  injury_state: string;
  vehicle_drivable: boolean;
  assistance_status: string;
  assistance_source: string | null;
  has_conflict: boolean;
  duplicate_import: boolean;
  updated_at: string;
  client: { id: string; full_name: string; phone: string; language: string };
  contract: {
    id: string;
    reference: string;
    insurer: string;
    vehicle: string;
    registration: string;
    valid_to: string;
  };
  documents: ClaimDocument[];
  tasks: ClaimTask[];
  notes: ClaimNote[];
  events: ClaimEvent[];
};

export type WorkspaceData = {
  profile: Profile;
  profiles: Profile[];
  claims: Claim[];
};

export type ClaimMutation =
  | {
      kind: "status";
      claimId: string;
      value: ClaimStatus;
      expected: ClaimStatus;
    }
  | { kind: "note"; claimId: string; body: string; requestId: string }
  | {
      kind: "task_create";
      claimId: string;
      title: string;
      dueAt: string;
      requestId: string;
    }
  | {
      kind: "task_toggle";
      claimId: string;
      taskId: string;
      completed: boolean;
      expectedCompleted: boolean;
    };

export const priorityLabels = {
  normale: "Normale",
  haute: "Haute",
  critique: "Critique",
};
export const documentLabels: Record<string, string> = {
  manquant: "Manquant",
  recu: "Reçu",
  a_verifier: "À vérifier",
  verifie: "Vérifié",
  rejete: "À remplacer",
};

export function attentionItems(claim: Claim): string[] {
  if (claim.status === "clos") return [];
  const items: string[] = [];
  if (claim.injury_state !== "none")
    items.push("Revue humaine · blessure signalée");
  if (!claim.vehicle_drivable && claim.assistance_status !== "verifiee")
    items.push("Vérifier la garantie assistance");
  if (claim.has_conflict) items.push("Examiner le conflit de contrat");
  if (claim.duplicate_import) items.push("Examiner l’import en doublon");
  const missing = claim.documents
    .filter((doc) => ["manquant", "rejete"].includes(doc.status))
    .sort(
      (a, b) => Number(b.type === "constat") - Number(a.type === "constat"),
    );
  items.push(...missing.map((doc) => `Demander : ${doc.label.toLowerCase()}`));
  if (
    claim.documents.some((doc) => ["recu", "a_verifier"].includes(doc.status))
  )
    items.push("Vérifier les pièces reçues");
  return items;
}

export function nextAction(claim: Claim): string {
  if (claim.status === "clos") return "Dossier clos · aucune action";
  return (
    attentionItems(claim)[0] ??
    [...claim.tasks]
      .filter((task) => !task.completed_at)
      .sort(
        (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
      )[0]?.title ??
    "Faire le point sur le dossier"
  );
}
