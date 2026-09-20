import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return new NextResponse("Connexion requise", { status: 401 });
  const path = request.nextUrl.searchParams.get("path");
  if (!path || path.length > 300)
    return new NextResponse("Document introuvable", { status: 404 });
  const { data, error } = await db.storage
    .from("client-documents")
    .createSignedUrl(path, 300);
  if (error) return new NextResponse("Document indisponible", { status: 404 });
  return NextResponse.redirect(data.signedUrl, {
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
