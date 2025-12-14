import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

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

  // Extract the storage path from the URL (Railway presigned URLs have the key in the path)
  // Try to extract path from Railway Storage URL or fall back to stored path pattern
  let storagePath: string | null = null;
  
  try {
    const url = new URL(user.avatar_url);
    // Railway URLs have the bucket name as subdomain and key in path
    // e.g., https://bucket-name.storage.railway.app/profileimage/userId/file.jpg
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      storagePath = pathParts.join('/');
    }
  } catch {
    // If URL parsing fails, try legacy Supabase pattern
    const pathMatch = user.avatar_url.match(/profileimage\/(.+?)(?:\?|$)/);
    if (pathMatch) {
      storagePath = `profileimage/${pathMatch[1]}`;
    }
  }
  
  if (!storagePath) {
    return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
  }

  // Download the file from Railway Storage
  const storage = getRailwayStorage();
  const { data, error } = await storage.download(storagePath);

  if (error || !data) {
    console.error("Error downloading avatar:", error);
    return NextResponse.json({ error: "Failed to download avatar" }, { status: 500 });
  }

  // Get content type from metadata
  const { contentType } = await storage.getMetadata(storagePath);

  // Return the image
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
