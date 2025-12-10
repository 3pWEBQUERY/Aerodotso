import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const supabase = createSupabaseServerClient();

  // Get user's avatar_url from database
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .single();

  if (userError || !user?.avatar_url) {
    return NextResponse.json({ error: "No avatar found" }, { status: 404 });
  }

  // Extract the storage path from the URL
  const url = new URL(user.avatar_url);
  const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/profileimage\/(.+)/);
  
  if (!pathMatch) {
    return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
  }

  const storagePath = decodeURIComponent(pathMatch[1]);

  // Download the file from storage
  const { data, error } = await supabase.storage
    .from("profileimage")
    .download(storagePath);

  if (error || !data) {
    console.error("Error downloading avatar:", error);
    return NextResponse.json({ error: "Failed to download avatar" }, { status: 500 });
  }

  // Return the image
  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
