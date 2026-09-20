import { describe, expect, it } from "vitest";
import scenarios from "../../lib/demo/scenarios.json";
import {
  attentionItems,
  nextAction,
  type WorkspaceData,
} from "../../lib/domain/claims/model";
import { mutateDemo } from "../../lib/demo/mutate";

const data = scenarios as WorkspaceData;
describe("claim attention", () => {
  it("preserves the five primary scenario actions", () => {
    expect(data.claims.map(nextAction)).toEqual([
      "Demander : constat amiable",
      "Vérifier la garantie assistance",
      "Revue humaine · blessure signalée",
      "Examiner le conflit de contrat",
      "Examiner l’import en doublon",
    ]);
  });
  it("retains overlapping blockers, with injury before assistance", () => {
    const claim = {
      ...data.claims[0],
      injury_state: "yes",
      vehicle_drivable: false,
      has_conflict: true,
    };
    expect(attentionItems(claim).slice(0, 4)).toEqual([
      "Revue humaine · blessure signalée",
      "Vérifier la garantie assistance",
      "Examiner le conflit de contrat",
      "Demander : constat amiable",
    ]);
    expect(attentionItems({ ...claim, status: "clos" })).toEqual([]);
  });
  it("a received report advances to verification, not missing or verified", () => {
    const claim = structuredClone(data.claims[0]);
    claim.documents[0].status = "recu";
    expect(nextAction(claim)).toBe("Vérifier les pièces reçues");
  });
  it("undo restores only the selected task without mutating the fixtures", () => {
    const first = data.claims[0];
    const second = data.claims[1];
    let next = mutateDemo(data, {
      kind: "task_toggle",
      claimId: first.id,
      taskId: first.tasks[0].id,
      completed: true,
      expectedCompleted: false,
    });
    expect(next.claims[0]).not.toBe(first);
    expect(next.claims[1]).toBe(second);
    next = mutateDemo(next, {
      kind: "task_toggle",
      claimId: second.id,
      taskId: second.tasks[0].id,
      completed: true,
      expectedCompleted: false,
    });
    next = mutateDemo(next, {
      kind: "task_toggle",
      claimId: first.id,
      taskId: first.tasks[0].id,
      completed: false,
      expectedCompleted: true,
    });
    expect(next.claims[0].tasks[0].completed_at).toBeNull();
    expect(next.claims[1].tasks[0].completed_at).not.toBeNull();
    expect(data.claims[1].tasks[0].completed_at).toBeNull();
  });
});
