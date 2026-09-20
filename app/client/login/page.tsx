import { ClientLogin } from "@/components/client/login";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <ClientLogin
      accessError={(await searchParams).error === "access"}
      available={Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      )}
    />
  );
}
