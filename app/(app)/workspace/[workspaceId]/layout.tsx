import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkspacePanelLayout } from "@/components/workspace/workspace-panel-layout";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;

  // Verify user has access to this workspace
  const supabase = createSupabaseServerClient();
  
  // Check if user owns or is member of this workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .single();

  if (!workspace) {
    // Workspace doesn't exist, redirect to default
    redirect("/workspace");
  }

  // Check ownership
  const { data: ownedWorkspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .single();

  // Check membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!ownedWorkspace && !membership) {
    // User has no access, redirect to default
    redirect("/workspace");
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex flex-shrink-0">
        <SidebarNav workspaceId={workspaceId} />
      </aside>
      <WorkspacePanelLayout workspaceId={workspaceId}>
        {children}
      </WorkspacePanelLayout>
    </div>
  );
}
