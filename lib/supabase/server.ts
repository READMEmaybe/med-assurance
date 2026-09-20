import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnvironment } from "@/lib/env/public";
import type { Database } from "@/types/database";

/** Request-scoped client. Cookie writes only in Server Actions / Route Handlers.
 * Session refresh runs in proxy.ts; broker routes verify users and profile scope.
 */
export async function createClient({ writableCookies = false } = {}) {
  const env = getPublicEnvironment();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(values) {
          if (!writableCookies) return;
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
