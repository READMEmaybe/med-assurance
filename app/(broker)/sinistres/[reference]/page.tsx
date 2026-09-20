import { RecordScreen } from "@/components/workspace/screens";
import { readWorkspace } from "@/lib/workspace";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const data = await readWorkspace();
  if (!data.claims.some((c) => c.reference === reference)) notFound();
  return <RecordScreen key={reference} reference={reference} />;
}
