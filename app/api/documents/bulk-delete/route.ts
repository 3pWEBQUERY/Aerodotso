import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { createNotification } from "@/lib/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE: Delete multiple documents
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentIds, workspaceId } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: "Document IDs required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // First get storage paths and titles to delete files
    const { data: docs } = await supabase
      .from("documents")
      .select("storage_path, title, workspace_id")
      .in("id", documentIds);

    // Delete from Railway Storage
    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.storage_path).filter(Boolean);
      if (paths.length > 0) {
        const storage = getRailwayStorage();
        await storage.removeMany(paths);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from("documents")
      .delete()
      .in("id", documentIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notification for document deletion
    const session = await getServerSession(authOptions);
    const wsId = workspaceId || docs?.[0]?.workspace_id;
    if (session?.user && wsId) {
      const userId = (session.user as any).id;
      const count = documentIds.length;
      const titles = docs?.map(d => d.title).slice(0, 3) || [];
      await createNotification({
        userId,
        workspaceId: wsId,
        title: count === 1 ? "Document deleted" : `${count} documents deleted`,
        message: titles.join(", ") + (count > 3 ? ` +${count - 3} more` : ""),
        type: "info",
        actionType: "document_delete",
        metadata: { documentIds, count, titles },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete documents error", error);
    return NextResponse.json({ error: "Failed to delete documents" }, { status: 500 });
  }
}
