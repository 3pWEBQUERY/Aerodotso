import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    const { data, error } = await supabase
      .from("folders")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", folderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ folder: data }, { status: 200 });
  } catch (error) {
    console.error("Rename folder error", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}
