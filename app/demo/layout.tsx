import { WorkspaceProvider } from "@/components/workspace/provider";
import scenarios from "@/lib/demo/scenarios.json";
import type { WorkspaceData } from "@/lib/domain/claims/model";
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider
      initialData={scenarios as WorkspaceData}
      demo
      now="2026-09-19T12:30:00+01:00"
    >
      {children}
    </WorkspaceProvider>
  );
}
