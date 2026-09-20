import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// Buffer first so a failed CLI invocation cannot truncate the checked-in types.
const types = execFileSync(
  "supabase",
  ["gen", "types", "typescript", "--local", "--schema", "public"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
writeFileSync("types/database.ts", types);
