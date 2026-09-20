import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Claim, Profile, WorkspaceData } from "@/lib/domain/claims/model";

export const requireBroker = cache(async () => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    redirect("/login");
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .single();
  if (!profile?.active || profile.role === "client")
    redirect("/login?error=access");
  return { db, profile: profile as Profile, user };
});

// Deduplicate layout and record-page reads within the same request only.
export const readWorkspace = cache(async (): Promise<WorkspaceData> => {
  const { db, profile } = await requireBroker();
  const [claims, profiles] = await Promise.all([
    db
      .from("claims")
      .select(
        "*, client:clients!claims_organization_id_client_id_fkey(id,full_name,phone,language), contract:contracts!claims_organization_id_client_id_contract_id_fkey(id,reference,insurer,vehicle,registration,valid_to), documents(id,label,type,status,source,storage_path), tasks(id,title,due_at,completed_at,assigned_to), notes(id,body,created_at,author_name), events:activity_events(id,action,label,actor_name,created_at)",
      )
      .order("updated_at", { ascending: false }),
    db
      .from("profiles")
      .select("id,full_name,role")
      .neq("role", "client")
      .eq("active", true),
  ]);
  if (claims.error || profiles.error)
    throw new Error(
      "Les dossiers sont momentanément indisponibles. Réessayez.",
    );
  return {
    profile,
    profiles: profiles.data as Profile[],
    claims: claims.data as unknown as Claim[],
  };
});
