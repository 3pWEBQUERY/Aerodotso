import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List folders for a workspace
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const parentFolderId = searchParams.get("parentFolderId");
    const type = searchParams.get("type"); // 'documents' | 'notes' | null (all)

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID required" }, { status: 400 });
    }

    let query = supabase
      .from("folders")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    // Only filter by parentFolderId if explicitly provided
    // This allows getting ALL folders for breadcrumb navigation
    if (parentFolderId === "root") {
      query = query.is("parent_folder_id", null);
    } else if (parentFolderId) {
      query = query.eq("parent_folder_id", parentFolderId);
    }
    // If parentFolderId is not provided, return ALL folders

    // Filter by type if provided
    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folders: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("List folders error", error);
    return NextResponse.json({ error: "Failed to list folders" }, { status: 500 });
  }
}

// POST: Create a new folder
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, workspaceId, parentFolderId, type } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: "Name and workspace ID required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("folders")
      .insert({
        name,
        workspace_id: workspaceId,
        parent_folder_id: parentFolderId || null,
        type: type || "documents", // Default to 'documents' for backwards compatibility
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notification for folder creation
    const session = await getServerSession(authOptions);
    if (session?.user && workspaceId) {
      const userId = (session.user as any).id;
      await createNotification({
        userId,
        workspaceId,
        title: "Folder created",
        message: name,
        type: "success",
        actionType: "folder_create",
        metadata: { folderName: name, folderId: data.id, folderType: type || "documents" },
      });
    }

    return NextResponse.json({ folder: data }, { status: 201 });
  } catch (error) {
    console.error("Create folder error", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

// DELETE: Delete a folder
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json({ error: "Folder ID required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get folder details before deleting for notification
    const { data: folder } = await supabase
      .from("folders")
      .select("name, workspace_id")
      .eq("id", folderId)
      .single();

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notification for folder deletion
    const session = await getServerSession(authOptions);
    if (session?.user && folder?.workspace_id) {
      const userId = (session.user as any).id;
      await createNotification({
        userId,
        workspaceId: folder.workspace_id,
        title: "Folder deleted",
        message: folder.name,
        type: "info",
        actionType: "folder_delete",
        metadata: { folderName: folder.name, folderId },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete folder error", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}

// PATCH: Rename folder
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { folderId, name } = body;

    if (!folderId || !name) {
      return NextResponse.json(
        { error: "Folder ID and name required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Get old name for notification
    const { data: oldFolder } = await supabase
      .from("folders")
      .select("name, workspace_id")
      .eq("id", folderId)
      .single();

    const { data, error } = await supabase
      .from("folders")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", folderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notification for folder rename
    const session = await getServerSession(authOptions);
    if (session?.user && oldFolder?.workspace_id && oldFolder.name !== name) {
      const userId = (session.user as any).id;
      await createNotification({
        userId,
        workspaceId: oldFolder.workspace_id,
        title: "Folder renamed",
        message: `${oldFolder.name} → ${name}`,
        type: "info",
        actionType: "folder_rename",
        metadata: { oldName: oldFolder.name, newName: name, folderId },
      });
    }

    return NextResponse.json({ folder: data }, { status: 200 });
  } catch (error) {
    console.error("Rename folder error", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}
