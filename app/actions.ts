"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { readWorkspace, requireBroker } from "@/lib/workspace";
import { claimStatusLabels } from "@/lib/domain/claims/status";
import type { ClaimMutation, WorkspaceData } from "@/lib/domain/claims/model";

export async function login(_state: { error: string }, form: FormData) {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(200) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success)
    return {
      error: "Renseignez une adresse e-mail et un mot de passe valides.",
    };
  try {
    const db = await createClient({ writableCookies: true });
    const { data, error } = await db.auth.signInWithPassword(parsed.data);
    if (error || !data.user)
      return {
        error: "Connexion impossible. Vérifiez vos identifiants et réessayez.",
      };
    const { data: profile } = await db
      .from("profiles")
      .select("active,role")
      .eq("id", data.user.id)
      .single();
    if (!profile?.active || profile.role === "client") {
      await db.auth.signOut();
      return { error: "Ce compte n’a pas accès à l’espace courtier." };
    }
  } catch {
    return {
      error:
        "La connexion est momentanément indisponible. Réessayez dans un instant.",
    };
  }
  redirect("/accueil");
}

export async function logout() {
  const db = await createClient({ writableCookies: true });
  await db.auth.signOut();
  redirect("/login");
}

const id = z.uuid();
const status = z.enum(
  Object.keys(claimStatusLabels) as [
    keyof typeof claimStatusLabels,
    ...(keyof typeof claimStatusLabels)[],
  ],
);
const mutationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("status"),
    claimId: id,
    value: status,
    expected: status,
  }),
  z.object({
    kind: z.literal("note"),
    claimId: id,
    body: z.string().trim().min(1).max(4000),
    requestId: id,
  }),
  z.object({
    kind: z.literal("task_create"),
    claimId: id,
    title: z.string().trim().min(1).max(200),
    dueAt: z.iso.datetime({ offset: true }),
    requestId: id,
  }),
  z.object({
    kind: z.literal("task_toggle"),
    claimId: id,
    taskId: id,
    completed: z.boolean(),
    expectedCompleted: z.boolean(),
  }),
]);

export async function mutateClaim(
  input: ClaimMutation,
): Promise<{ data?: WorkspaceData; error?: string }> {
  const parsed = mutationSchema.safeParse(input);
  if (!parsed.success) return { error: "Vérifiez les informations saisies." };
  const { db } = await requireBroker();
  const { kind, claimId, ...payload } = parsed.data;
  const { error } = await db.rpc("mutate_claim", {
    p_claim_id: claimId,
    p_kind: kind,
    p_payload: payload,
  });
  if (error)
    return {
      error:
        error.code === "40001"
          ? "Ce dossier a été modifié. Actualisez la page avant de réessayer."
          : error.code === "23514"
            ? "Cette action nécessite un dossier ouvert et, en cas de blessure, une revue humaine préalable."
            : "Modification non enregistrée. Vérifiez votre accès et réessayez.",
    };
  revalidatePath("/accueil");
  revalidatePath("/sinistres", "layout");
  revalidatePath("/taches");
  try {
    return { data: await readWorkspace() };
  } catch {
    return {
      error:
        "Modification enregistrée, mais le rechargement a échoué. Actualisez la page pour voir le résultat.",
    };
  }
}

export async function updateBrokerPassword(
  _state: { error: string; success: boolean },
  form: FormData,
): Promise<{ error: string; success: boolean }> {
  const { user } = await requireBroker();
  const current = String(form.get("current") ?? "");
  const password = String(form.get("password") ?? "");
  if (
    !current ||
    current.length > 128 ||
    password.length < 12 ||
    password.length > 128 ||
    password !== form.get("confirm")
  )
    return {
      error:
        "Renseignez votre mot de passe actuel et confirmez un nouveau mot de passe d’au moins 12 caractères.",
      success: false,
    };
  if (!user.email)
    return {
      error:
        "Ce compte ne permet pas cette modification. Contactez votre administrateur.",
      success: false,
    };
  try {
    const db = await createClient({ writableCookies: true });
    const { error: authError } = await db.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (authError)
      return {
        error:
          "Le mot de passe actuel n’a pas pu être vérifié. Vérifiez-le et réessayez.",
        success: false,
      };
    const { error } = await db.auth.updateUser({ password });
    if (error)
      return {
        error:
          "Le mot de passe n’a pas été modifié. Choisissez un nouveau mot de passe plus fort et réessayez.",
        success: false,
      };
    return { error: "", success: true };
  } catch {
    return {
      error: "Connexion interrompue. Vérifiez votre réseau et réessayez.",
      success: false,
    };
  }
}
