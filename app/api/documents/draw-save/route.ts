import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") as string | null;

    if (!file || !documentId) {
      return NextResponse.json(
        { error: "Datei oder Dokument-ID fehlen" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: baseDoc, error: baseError } = await supabase
      .from("documents")
      .select("id, title")
      .eq("id", documentId)
      .single();

    if (baseError || !baseDoc) {
      return NextResponse.json(
        { error: "Originaldokument nicht gefunden" },
        { status: 404 }
      );
    }

    const storagePath = `documents/drawings/${documentId}/${randomUUID()}.png`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Railway Storage Bucket
    const storage = getRailwayStorage();
    const { error: uploadError } = await storage.upload(storagePath, buffer, {
      contentType: "image/png",
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("document_versions")
      .insert({
        document_id: documentId,
        storage_path: storagePath,
        mime_type: "image/png",
        size_bytes: file.size,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message }, { status: 500 });
    }

    const { signedUrl: signed } = await storage.createSignedUrl(storagePath, 60 * 60);

    return NextResponse.json(
      {
        version: {
          ...inserted,
          signedUrl: signed ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Draw save error", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Speichern der Zeichnung" },
      { status: 500 }
    );
  }
}
