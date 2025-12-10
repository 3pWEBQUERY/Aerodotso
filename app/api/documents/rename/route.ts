import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body?.id as string | undefined;
    const title = body?.title as string | undefined;

    if (!id || !title || typeof id !== "string" || typeof title !== "string") {
      return NextResponse.json(
        { error: "Ungültige Eingabe für Umbenennen" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("documents")
      .update({ title })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data }, { status: 200 });
  } catch (error) {
    console.error("Rename document error", error);
    return NextResponse.json(
      { error: "Interner Fehler beim Umbenennen" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const documentId = body?.documentId as string | undefined;
    const name = body?.name as string | undefined;

    if (!documentId || !name) {
      return NextResponse.json(
        { error: "Document ID and name required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("documents")
      .update({ title: name })
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data }, { status: 200 });
  } catch (error) {
    console.error("Rename document error", error);
    return NextResponse.json(
      { error: "Failed to rename document" },
      { status: 500 }
    );
  }
}
