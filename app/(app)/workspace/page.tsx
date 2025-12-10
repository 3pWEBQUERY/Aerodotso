import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateWorkspaceForUser } from "@/lib/workspaces";

export default async function WorkspacePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string | undefined;

  if (!userId) {
    redirect("/login");
  }

  const workspace = await getOrCreateWorkspaceForUser(userId);

  redirect(`/workspace/${workspace.id}`);
}
