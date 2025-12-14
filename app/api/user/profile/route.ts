import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { randomUUID } from "node:crypto";

// Get user profile
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar_url, support_access")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// Update user profile (name, support_access)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const supabase = createSupabaseServerClient();

  // Build update object with only provided fields
  const updateData: Record<string, any> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.support_access !== undefined) updateData.support_access = body.support_access;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)
    .select("id, name, email, avatar_url, support_access")
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// Upload profile image
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `profileimage/${userId}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Railway Storage Bucket
  const storage = getRailwayStorage();
  const { error: uploadError } = await storage.upload(storagePath, buffer, {
    contentType: file.type,
  });

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get signed URL - valid for 1 year
  const { signedUrl, error: urlError } = await storage.createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (urlError || !signedUrl) {
    console.error("Error creating signed URL:", urlError);
    return NextResponse.json({ error: "Failed to create URL" }, { status: 500 });
  }

  const avatarUrl = signedUrl;

  // Update user record
  const { data: userData, error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (updateError) {
    console.error("Error updating user avatar:", updateError);
    return NextResponse.json({ error: "Failed to update avatar" }, { status: 500 });
  }

  return NextResponse.json({ user: userData, avatarUrl });
}
