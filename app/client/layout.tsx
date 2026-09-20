import { cookies } from "next/headers";
import { ClientLanguage } from "@/components/client/language";
import "./portal.css";
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language =
    (await cookies()).get("portal-language")?.value === "ar" ? "ar" : "fr";
  return <ClientLanguage initial={language}>{children}</ClientLanguage>;
}
