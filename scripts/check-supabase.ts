import nextEnv from "@next/env";
import { getPublicEnvironment } from "../lib/env/public";

nextEnv.loadEnvConfig(process.cwd(), true);
try {
  const env = getPublicEnvironment();
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
    {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Supabase connectivity check failed (HTTP ${response.status}).`,
    );
  const settings: unknown = await response.json();
  if (
    typeof settings !== "object" ||
    settings === null ||
    !("external" in settings)
  )
    throw new Error("Supabase returned an unexpected Auth settings response.");
  console.log(
    "Supabase Auth settings reachable; publishable key accepted. No records changed. This does not verify database permissions or migration access.",
  );
} catch (error) {
  // Network errors can embed URLs; keep output deliberately generic.
  console.error(
    error instanceof Error &&
      (error.message.startsWith("Missing or invalid") ||
        error.message.startsWith("Supabase"))
      ? error.message
      : "Supabase unreachable; check connectivity and project configuration.",
  );
  process.exitCode = 1;
}
