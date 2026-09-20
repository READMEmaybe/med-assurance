import { claimStatusLabels } from "../domain/claims/status";
import type { ClaimMutation, WorkspaceData } from "@/lib/domain/claims/model";

/** In-memory sandbox only. Authenticated writes use the transactional database RPC. */
export function mutateDemo(
  data: WorkspaceData,
  input: ClaimMutation,
): WorkspaceData {
  const index = data.claims.findIndex((c) => c.id === input.claimId);
  if (index === -1) throw new Error("Dossier introuvable.");
  const claim = structuredClone(data.claims[index]);
  const next = { ...data, claims: [...data.claims] };
  next.claims[index] = claim;
  const now = new Date().toISOString();
  let label = "";
  if (input.kind !== "status" && claim.status === "clos")
    throw new Error("Rouvrez le dossier avant d’ajouter un suivi.");
  switch (input.kind) {
    case "status":
      if (
        claim.injury_state !== "none" &&
        input.value !== "intervention_requise"
      )
        throw new Error(
          "Une revue humaine est nécessaire avant de changer ce statut.",
        );
      if (claim.status !== input.expected)
        throw new Error("Le statut a changé. Réessayez.");
      label = `Statut : ${claimStatusLabels[claim.status]} → ${claimStatusLabels[input.value]}`;
      claim.status = input.value;
      break;
    case "note":
      if (!input.body.trim()) throw new Error("Renseignez votre note.");
      if (claim.notes.some((n) => n.id === input.requestId)) return data;
      claim.notes.push({
        id: input.requestId,
        body: input.body.trim(),
        created_at: now,
        author_name: data.profile.full_name,
      });
      label = "Note interne ajoutée";
      break;
    case "task_create":
      if (!input.title.trim()) throw new Error("Renseignez le suivi.");
      if (claim.tasks.some((t) => t.id === input.requestId)) return data;
      claim.tasks.push({
        id: input.requestId,
        title: input.title.trim(),
        due_at: input.dueAt,
        completed_at: null,
        assigned_to: claim.assigned_agent_id,
      });
      label = `Suivi créé : ${input.title.trim()}`;
      break;
    case "task_toggle": {
      const task = claim.tasks.find((t) => t.id === input.taskId);
      if (!task || Boolean(task.completed_at) !== input.expectedCompleted)
        throw new Error("Ce suivi a changé. Réessayez.");
      task.completed_at = input.completed ? now : null;
      label = `${input.completed ? "Suivi terminé" : "Suivi rouvert"} : ${task.title}`;
      break;
    }
  }
  claim.updated_at = now;
  claim.events.push({
    id: crypto.randomUUID(),
    action: input.kind,
    label,
    actor_name: data.profile.full_name,
    created_at: now,
  });
  return next;
}
