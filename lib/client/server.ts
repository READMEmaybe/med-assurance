import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PortalData } from "./model";

export const requireClient = cache(async () => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    redirect("/client/login");
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/client/login");
  const { data: profile } = await db
    .from("profiles")
    .select("role,active")
    .eq("id", user.id)
    .single();
  if (!profile?.active || profile.role !== "client")
    redirect("/client/login?error=access");
  return { db, user };
});

export const readPortal = cache(async () => {
  const { db, user } = await requireClient();
  const { data, error } = await db.rpc("portal_workspace");
  if (error || !data)
    throw new Error(
      "Votre espace est momentanément indisponible. Contactez votre cabinet si le problème persiste.",
    );
  const portal = data as unknown as PortalData;
  portal.draftId = portal.draft?.id ?? crypto.randomUUID();
  portal.profile.email = user.email;
  if (portal.profile.avatar_path) {
    const { data: avatar } = await db.storage
      .from("avatars")
      .createSignedUrl(portal.profile.avatar_path, 3600);
    portal.profile.avatar_url = avatar?.signedUrl;
  }
  return portal;
});
