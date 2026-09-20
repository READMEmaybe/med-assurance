import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  HomeScreen,
  ClaimsScreen,
  TasksScreen,
  RecordScreen,
} from "@/components/workspace/screens";
import scenarios from "@/lib/demo/scenarios.json";
export function generateStaticParams() {
  return [
    ...["accueil", "sinistres", "taches"].map((page) => ({ path: [page] })),
    ...scenarios.claims.map((claim) => ({
      path: ["sinistres", claim.reference],
    })),
  ];
}

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  let screen;
  if (!path.length || (path.length === 1 && path[0] === "accueil"))
    screen = <HomeScreen />;
  else if (path.length === 1 && path[0] === "sinistres")
    screen = <ClaimsScreen />;
  else if (path.length === 1 && path[0] === "taches") screen = <TasksScreen />;
  else if (
    path.length === 2 &&
    path[0] === "sinistres" &&
    scenarios.claims.some((c) => c.reference === path[1])
  )
    screen = <RecordScreen key={path[1]} reference={path[1]} />;
  else notFound();
  return (
    <Suspense fallback={<p>Chargement de l’espace…</p>}>{screen}</Suspense>
  );
}
