import { readPortal } from "@/lib/client/server";
import { Portal } from "@/components/client/portal";
export default async function ClientHomePage() {
  return <Portal data={await readPortal()} screen="home" />;
}
