import nextEnv from "@next/env";
import { getPublicEnvironment } from "../lib/env/public";

nextEnv.loadEnvConfig(process.cwd(), true);
try {
  getPublicEnvironment();
  console.log("Supabase public environment: valid (values hidden).");
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Invalid environment configuration.",
  );
  process.exitCode = 1;
}
