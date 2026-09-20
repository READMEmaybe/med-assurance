import { WorkspaceProvider } from "@/components/workspace/provider";
import { readWorkspace } from "@/lib/workspace";

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await readWorkspace();
  return (
    <WorkspaceProvider initialData={data} now={new Date().toISOString()}>
      {children}
    </WorkspaceProvider>
  );
}
