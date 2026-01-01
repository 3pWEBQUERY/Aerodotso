import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";

async function resolveUserId(req: NextRequest, session: any): Promise<string | null> {
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  if (sessionUserId) return sessionUserId;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const tokenUserId = ((token as any)?.id as string | undefined) ?? (token?.sub as string | undefined);
  return tokenUserId ?? null;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * POST /api/search/visual
 * Visual similarity search - find similar images/persons in the workspace
 * Uses Gemini to directly compare the search image against workspace images
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const session = await getServerSession(authOptions);
    const userId = await resolveUserId(req, session);

    // Parse form data
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const queryText = formData.get("query") as string | null;

    if (!image || !workspaceId) {
      return NextResponse.json(
        { error: "Image and workspaceId are required" },
        { status: 400 }
      );
    }

    // Convert search image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64SearchImage = Buffer.from(imageBuffer).toString("base64");
    const searchMimeType = image.type || "image/jpeg";

    // Get all image documents from the workspace
    const { data: allDocs } = await supabase
      .from("documents")
      .select("id, title, mime_type, storage_path, thumbnail_path, description, tags, searchable_text")
      .eq("workspace_id", workspaceId)
      .like("mime_type", "image/%")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!allDocs || allDocs.length === 0) {
      return NextResponse.json({ 
        results: [],
        message: "No images found in workspace"
      });
    }

    const storage = getRailwayStorage();
    
    // Get signed URLs for all workspace images to compare
    const docsWithUrls = await Promise.all(allDocs.map(async (doc) => {
      let imageUrl = null;
      let thumbnailUrl = null;
      
      if (doc.storage_path) {
        const { signedUrl } = await storage.createSignedUrl(doc.storage_path, 3600);
        imageUrl = signedUrl;
      }
      if (doc.thumbnail_path) {
        const { signedUrl } = await storage.createSignedUrl(doc.thumbnail_path, 3600);
        thumbnailUrl = signedUrl;
      }
      
      return { ...doc, imageUrl, thumbnailUrl };
    }));

    // Filter docs that have valid URLs
    const validDocs = docsWithUrls.filter(doc => doc.imageUrl || doc.thumbnailUrl);
    
    if (validDocs.length === 0) {
      return NextResponse.json({ 
        results: [],
        message: "No accessible images found"
      });
    }

    // Fetch and convert workspace images to base64 for comparison (use thumbnails for speed)
    const workspaceImages: { doc: typeof validDocs[0]; base64: string; mimeType: string }[] = [];
    
    for (const doc of validDocs.slice(0, 20)) { // Limit to 20 for API constraints
      try {
        const urlToFetch = doc.thumbnailUrl || doc.imageUrl;
        if (!urlToFetch) continue;
        
        const imgResponse = await fetch(urlToFetch);
        if (!imgResponse.ok) continue;
        
        const imgBuffer = await imgResponse.arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString("base64");
        const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";
        
        workspaceImages.push({ doc, base64, mimeType });
      } catch (error) {
        console.error(`Failed to fetch image for doc ${doc.id}:`, error);
      }
    }

    if (workspaceImages.length === 0) {
      return NextResponse.json({ 
        results: [],
        message: "Could not process workspace images"
      });
    }

    // Use Gemini to compare images directly
    // Build a multi-image comparison request
    const comparisonPrompt = `You are a visual similarity expert. I'm showing you a SEARCH IMAGE first, followed by ${workspaceImages.length} WORKSPACE IMAGES numbered 0 to ${workspaceImages.length - 1}.

Your task: Find which workspace images contain THE SAME PERSON as the search image.

CRITICAL: Look for:
- Same face/facial features
- Same person from different angles
- Same person in different lighting/settings
- Same person with different clothing

Rate each workspace image from 0.0 to 1.0 based on how likely it shows THE SAME PERSON:
- 1.0 = Definitely the same person
- 0.8+ = Very likely same person
- 0.5-0.8 = Possibly same person
- Below 0.5 = Different person

${queryText ? `Additional context from user: "${queryText}"` : ""}

Output ONLY a JSON object with this exact format:
{
  "searchImageDescription": "brief description of person in search image",
  "matches": [
    {"index": 0, "similarity": 0.95, "reason": "Same face, same hair color"},
    {"index": 2, "similarity": 0.7, "reason": "Similar features, different angle"}
  ]
}

Include ALL images with similarity >= 0.3. Output ONLY valid JSON, no markdown.`;

    let matches: { index: number; similarity: number; reason: string }[] = [];
    let searchImageDescription = "";

    if (GEMINI_API_KEY) {
      try {
        // Build the parts array with search image first, then all workspace images
        const parts: any[] = [
          { text: "SEARCH IMAGE:" },
          { inline_data: { mime_type: searchMimeType, data: base64SearchImage } },
        ];
        
        // Add workspace images
        workspaceImages.forEach((img, idx) => {
          parts.push({ text: `\nWORKSPACE IMAGE ${idx}:` });
          parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
        });
        
        // Add the prompt at the end
        parts.push({ text: `\n\n${comparisonPrompt}` });

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { 
                maxOutputTokens: 2000,
                temperature: 0.1
              }
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          
          try {
            const parsed = JSON.parse(cleanContent);
            matches = parsed.matches || [];
            searchImageDescription = parsed.searchImageDescription || "";
            console.log("Visual search found matches:", matches.length);
          } catch (parseError) {
            console.error("Failed to parse Gemini response:", cleanContent.slice(0, 200));
          }
        } else {
          const errorText = await response.text();
          console.error("Gemini API error:", errorText);
        }
      } catch (error) {
        console.error("Gemini comparison failed:", error);
      }
    }

    // Build results from matches
    const results = matches
      .filter(m => m.similarity >= 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .map(match => {
        const doc = workspaceImages[match.index]?.doc;
        if (!doc) return null;
        
        return {
          document_id: doc.id,
          title: doc.title,
          mime_type: doc.mime_type,
          storage_path: doc.storage_path,
          thumbnail_path: doc.thumbnail_path,
          description: doc.description,
          tags: doc.tags,
          similarity: match.similarity,
          match_reason: match.reason,
          search_type: "visual_person",
          result_type: "document" as const,
          thumbnailUrl: doc.thumbnailUrl,
          previewUrl: doc.imageUrl,
        };
      })
      .filter(Boolean);

    // Save visual search to history
    const searchQueryLabel = queryText 
      ? `[Bildsuche] ${queryText}` 
      : `[Bildsuche] ${image.name || "Personensuche"}`;
    
    if (userId) {
      // First delete any existing entry with same query to prevent duplicates
      await supabase
        .from("search_history")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("query", searchQueryLabel);
      
      const { error: historyError } = await supabase
        .from("search_history")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          query: searchQueryLabel,
          result_count: results.length,
          search_type: "visual_person",
        });
      
      if (historyError) {
        console.error("[Visual Search] Failed to save history:", historyError.code, historyError.message);
      } else {
        console.log("[Visual Search] Successfully saved to history");
      }
    }

    return NextResponse.json({ 
      results,
      searchDescription: searchImageDescription,
      totalCompared: workspaceImages.length,
    });

  } catch (error) {
    console.error("Visual search error:", error);
    return NextResponse.json(
      { error: "Visual search failed" },
      { status: 500 }
    );
  }
}
