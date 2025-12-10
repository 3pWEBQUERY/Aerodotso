import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function PATCH(request: NextRequest) {
  try {
    const { documentIds, isPublic } = await request.json();

    if (!documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: "documentIds required" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Generate public tokens for each document if making public
    for (const id of documentIds) {
      const { error } = await supabase
        .from("documents")
        .update({ 
          is_public: isPublic, 
          public_token: isPublic ? randomUUID() : null 
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share documents error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
