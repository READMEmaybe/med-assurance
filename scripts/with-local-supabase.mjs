import { execFileSync, spawn } from "node:child_process";

const status = JSON.parse(
  execFileSync("supabase", ["status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(status.API_URL))
  throw new Error("Expected local Supabase");
const [command, ...args] = process.argv.slice(2);
if (!command)
  throw new Error("Usage: with-local-supabase.mjs <command> [args]");
const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    TEST_LOCAL_SUPABASE: "1",
  },
});
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
