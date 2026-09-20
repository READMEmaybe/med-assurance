export type Language = "fr" | "ar";
export type Draft = {
  step: number;
  safe: string;
  injury: string;
  occurredAt: string;
  city: string;
  location: string;
  contractId: string;
  drivable: string;
  statement: string;
  language: Language;
  files: { constat?: string; photos?: string };
};
export type PortalDocument = {
  id: string;
  label: string;
  type: string;
  status: string;
  storage_path: string | null;
};
export type PortalClaim = {
  id: string;
  reference: string;
  status: string;
  occurred_at: string;
  city: string;
  location: string;
  statement: string;
  statement_language: string;
  updated_at: string;
  vehicle: string;
  registration: string;
  documents: PortalDocument[];
};
export type PortalData = {
  draftId: string;
  profile: {
    id: string;
    full_name: string;
    avatar_path: string | null;
    avatar_url?: string;
    email?: string;
  };
  contracts: {
    id: string;
    reference: string;
    vehicle: string;
    registration: string;
  }[];
  claims: PortalClaim[];
  draft: { id: string; payload: Draft } | null;
};
export type ActionResult = {
  error?: string;
  success?: boolean;
  reference?: string;
  url?: string;
};
