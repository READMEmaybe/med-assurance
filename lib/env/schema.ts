import { z } from "zod";

function isPublicKey(key: string): boolean {
  if (key.includes("replace_me")) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  // Local Supabase may issue legacy JWT anon keys. Never allow service_role.
  try {
    const payload = key.split(".")[1];
    if (!payload || key.split(".").length !== 3) return false;
    const decoded: unknown = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return (
      typeof decoded === "object" &&
      decoded !== null &&
      "role" in decoded &&
      decoded.role === "anon"
    );
  } catch {
    return false;
  }
}

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      url.hostname !== "your-project.supabase.co" &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
    );
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().refine(isPublicKey),
});

export function parsePublicEnvironment(input: Record<string, unknown>) {
  const result = publicEnvironmentSchema.safeParse(input);
  if (!result.success) {
    const names = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    // Never include input values or raw provider errors in diagnostics.
    throw new Error(
      `Missing or invalid environment variables: ${names.join(", ")}. See .env.example.`,
    );
  }
  return result.data;
}
