"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireClient } from "@/lib/client/server";
import type { ActionResult, Draft } from "@/lib/client/model";

export async function clientLogin(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!z.email().safeParse(email).success || !password)
    return { error: "credentials" };
  try {
    const db = await createClient({ writableCookies: true });
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) return { error: "credentials" };
    const { data: profile } = await db
      .from("profiles")
      .select("active,role")
      .eq("id", data.user.id)
      .single();
    if (!profile?.active || profile.role !== "client") {
      await db.auth.signOut();
      return { error: "access" };
    }
  } catch {
    return { error: "network" };
  }
  redirect("/client");
}
export async function clientLogout() {
  const db = await createClient({ writableCookies: true });
  const { error } = await db.auth.signOut();
  if (error) throw new Error("Déconnexion impossible. Réessayez.");
  redirect("/client/login");
}
const draftSchema = z.object({
  step: z.number().int().min(0).max(4),
  safe: z.enum(["", "yes", "no"]),
  injury: z.enum(["", "none", "yes", "unknown"]),
  occurredAt: z.string().max(40),
  city: z.string().max(120),
  location: z.string().max(300),
  contractId: z.string().max(200),
  drivable: z.enum(["", "yes", "no"]),
  statement: z.string().max(4000),
  language: z.enum(["fr", "ar"]),
  files: z.object({
    constat: z.string().max(300).optional(),
    photos: z.string().max(300).optional(),
  }),
});
export async function saveDraft(
  id: string,
  draft: Draft,
): Promise<ActionResult> {
  const parsed = draftSchema.safeParse(draft);
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return { error: "invalid" };
  const { db } = await requireClient();
  const { error } = await db.rpc("portal_save_draft", {
    p_id: id,
    p_payload: parsed.data,
  });
  return error ? { error: "save" } : { success: true };
}
export async function submitClaim(
  id: string,
  draft: Draft,
): Promise<ActionResult> {
  const parsed = draftSchema.safeParse(draft);
  if (!z.uuid().safeParse(id).success || !parsed.success)
    return { error: "invalid" };
  const { db } = await requireClient();
  const { data, error } = await db.rpc("portal_submit_claim", {
    p_id: id,
    p_payload: parsed.data,
  });
  if (error) return { error: "submit" };
  revalidatePath("/client", "layout");
  revalidatePath("/accueil");
  revalidatePath("/sinistres", "layout");
  return { success: true, reference: data };
}
export async function attachDocument(
  claimId: string,
  documentId: string,
  path: string,
): Promise<ActionResult> {
  if (
    !z.uuid().safeParse(claimId).success ||
    documentId.length > 200 ||
    path.length > 300
  )
    return { error: "invalid" };
  const { db } = await requireClient();
  const { error } = await db.rpc("portal_attach_document", {
    p_claim_id: claimId,
    p_document_id: documentId,
    p_path: path,
  });
  if (error) return { error: "upload" };
  revalidatePath("/client", "layout");
  revalidatePath("/sinistres", "layout");
  return { success: true };
}
export async function documentUrl(path: string): Promise<ActionResult> {
  const { db } = await requireClient();
  const { data, error } = await db.storage
    .from("client-documents")
    .createSignedUrl(path, 300);
  return error ? { error: "file" } : { url: data.signedUrl };
}
export async function updateProfile(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const name = String(form.get("name") ?? "").trim();
  const avatar = String(form.get("avatar") ?? "");
  if (name.length < 2 || name.length > 100 || avatar.length > 300)
    return { error: "invalid" };
  const { db } = await requireClient();
  const { error } = await db.rpc("portal_update_profile", {
    p_name: name,
    p_avatar: avatar,
  });
  if (error) return { error: "save" };
  revalidatePath("/client", "layout");
  return { success: true };
}
export async function updatePassword(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const current = String(form.get("current") ?? "");
  const password = String(form.get("password") ?? "");
  if (
    password.length < 12 ||
    password.length > 128 ||
    password !== form.get("confirm")
  )
    return { error: "password" };
  const { user } = await requireClient();
  if (!user.email) return { error: "access" };
  const db = await createClient({ writableCookies: true });
  const { error: authError } = await db.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (authError) return { error: "current" };
  const { error } = await db.auth.updateUser({ password });
  return error ? { error: "passwordSave" } : { success: true };
}
