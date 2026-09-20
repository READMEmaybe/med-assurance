import { notFound } from "next/navigation";
import { readPortal } from "@/lib/client/server";
import { Portal } from "@/components/client/portal";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const screen = path[0] ?? "home";
  if (
    !["home", "dossiers", "declarer", "profil"].includes(screen) ||
    path.length > 2 ||
    (path.length === 2 && screen !== "dossiers")
  )
    notFound();
  const data = await readPortal();
  const claim = path[1]
    ? data.claims.find((item) => item.reference === path[1])
    : undefined;
  if (path[1] && !claim) notFound();
  return (
    <Portal key={path.join("/")} data={data} screen={screen} claim={claim} />
  );
}
