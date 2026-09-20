// Stable vocabulary preserved from the M0 migration map; no workflow decisions yet.
export const claimStatusLabels = {
  nouveau: "Nouveau",
  a_traiter: "À traiter",
  en_cours: "En cours",
  en_attente_client: "En attente client",
  intervention_requise: "Intervention requise",
  clos: "Clos",
} as const;

export type ClaimStatus = keyof typeof claimStatusLabels;
