import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei übergeben" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const ext = file.name.split(".").pop() || "";
    const storagePath = `uploads/${randomUUID()}${ext ? `.${ext}` : ""}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        workspace_id: workspaceId || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Trigger async processing for AI features (embeddings, tags, summary)
    // Add random delay (0-5s) to stagger API calls and avoid rate limits
    const randomDelay = Math.floor(Math.random() * 5000);
    setTimeout(() => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/documents/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: inserted.id }),
      }).catch((err) => console.error("Failed to trigger processing:", err));
    }, randomDelay);

    return NextResponse.json(
      {
        success: true,
        document: inserted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Upload" },
      { status: 500 }
    );
  }
}
