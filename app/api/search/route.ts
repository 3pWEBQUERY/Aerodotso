import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRailwayStorage } from "@/lib/railway-storage";
import { generateQueryEmbedding } from "@/lib/visual-embeddings";

// Helper: Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function resolveUserId(req: NextRequest, session: any): Promise<string | null> {
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  if (sessionUserId) return sessionUserId;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const tokenUserId = ((token as any)?.id as string | undefined) ?? (token?.sub as string | undefined);
  return tokenUserId ?? null;
}


/**
 * POST /api/search
 * Comprehensive search across workspace documents
 * Supports: semantic (AI), text, and visual search
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const session = await getServerSession(authOptions);
    const userId = await resolveUserId(req, session);
    
    console.log("[Search API] Session:", session ? "exists" : "null");
    console.log("[Search API] UserId:", userId || "not found");

    const body = await req.json();
    const { 
      query, 
      workspaceId, 
      searchTypes = ["semantic", "text", "visual"],
      limit = 30,
      includeFrames = true 
    } = body;

    if (!query || !workspaceId) {
      return NextResponse.json(
        { error: "Query and workspaceId are required" },
        { status: 400 }
      );
    }

    // Generate embedding for semantic/visual search
    let queryEmbedding: number[] | null = null;
    
    if (searchTypes.includes("semantic") || searchTypes.includes("visual")) {
      try {
        queryEmbedding = await generateQueryEmbedding(query);
      } catch (embeddingError) {
        console.error("Embedding generation failed, falling back to text search:", embeddingError);
        // Continue with text search only
      }
    }

    // Perform combined search using the database function
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "search_workspace",
      {
        p_workspace_id: workspaceId,
        p_query: query,
        p_query_embedding: queryEmbedding ? `[${queryEmbedding.join(",")}]` : null,
        p_search_types: searchTypes,
        p_limit: limit,
      }
    );

    if (searchError) {
      console.error("Search RPC error:", searchError);
      
      // Fallback to simple text search including new fields
      const { data: fallbackResults, error: fallbackError } = await supabase
        .from("documents")
        .select("id, title, mime_type, storage_path, thumbnail_path, description, tags, ai_summary, searchable_text, detailed_analysis, created_at")
        .eq("workspace_id", workspaceId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,searchable_text.ilike.%${query}%`)
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json(
          { error: "Search failed" },
          { status: 500 }
        );
      }

      const resultsWithPreviews = await addPreviewUrls(supabase, fallbackResults || []);
      
      // Search in scratches
      const { data: scratchResults } = await supabase
        .from("scratches")
        .select("id, title, thumbnail, searchable_text, tags, created_at")
        .eq("workspace_id", workspaceId)
        .or(`title.ilike.%${query}%,searchable_text.ilike.%${query}%`)
        .limit(limit);
      
      const scratchItems = (scratchResults || []).map((s: any) => ({
        id: s.id,
        document_id: s.id,
        title: s.title || "Untitled Scratch",
        description: s.searchable_text?.slice(0, 200) || "",
        thumbnail_path: s.thumbnail,
        tags: s.tags,
        similarity: 0.7,
        search_type: "text",
        result_type: "scratch",
        created_at: s.created_at,
      }));
      
      // Search in notes
      const { data: noteResults } = await supabase
        .from("notes")
        .select("id, title, searchable_text, tags, created_at")
        .eq("workspace_id", workspaceId)
        .or(`title.ilike.%${query}%,searchable_text.ilike.%${query}%`)
        .limit(limit);
      
      const noteItems = (noteResults || []).map((n: any) => ({
        id: n.id,
        document_id: n.id,
        title: n.title || "Untitled Note",
        description: n.searchable_text?.slice(0, 200) || "",
        tags: n.tags,
        similarity: 0.7,
        search_type: "text",
        result_type: "note",
        created_at: n.created_at,
      }));
      
      // Also search in link transcripts
      const { data: transcriptResults } = await supabase
        .from("link_transcripts")
        .select(`
          id,
          text,
          start_time,
          end_time,
          link_id,
          links!inner(id, title, url, thumbnail_url, video_url, workspace_id)
        `)
        .eq("links.workspace_id", workspaceId)
        .ilike("text", `%${query}%`)
        .limit(limit);
      
      const linkResults = (transcriptResults || []).map((t: any) => ({
        id: t.link_id,
        document_id: t.link_id,
        title: t.links?.title || "Video",
        description: `[${formatTime(t.start_time)}] ${t.text}`,
        thumbnail_url: t.links?.thumbnail_url,
        video_url: t.links?.video_url,
        url: t.links?.url,
        similarity: 0.7,
        search_type: "transcript",
        result_type: "link",
        start_time: t.start_time,
      }));

      const fallbackAllResults = [
        ...resultsWithPreviews.map((r: any) => ({
          ...r,
          document_id: r.id,
          similarity: 0.5,
          search_type: "text",
          result_type: "document",
        })),
        ...scratchItems,
        ...noteItems,
        ...linkResults,
      ];

      // Save search to history for fallback path - ALWAYS include user_id
      // Delete existing identical query first to prevent duplicates, then insert
      if (userId) {
        await supabase
          .from("search_history")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .eq("query", query);
        
        const { error: historyError } = await supabase
          .from("search_history")
          .insert({
            workspace_id: workspaceId,
            user_id: userId,
            query,
            result_count: fallbackAllResults.length,
            search_type: "text_fallback",
          });
        if (historyError) {
          console.error("[Search Fallback] FAILED:", historyError.code, historyError.message);
        } else {
          console.log("[Search Fallback] Successfully saved");
        }
      } else {
        console.warn("[Search Fallback] No userId resolved - skipping search history insert");
      }

      return NextResponse.json({
        results: fallbackAllResults,
        query,
        search_type: "text_fallback",
        total: fallbackAllResults.length,
      });
    }

    // Deduplicate results (same document might appear in multiple search types)
    const deduped = deduplicateResults(searchResults || []);
    
    // Apply precision filtering for more accurate results
    const filtered = applyPrecisionFilter(deduped, query);
    
    // Add preview URLs
    const resultsWithPreviews = await addPreviewUrls(supabase, filtered);
    
    // Also search in link transcripts
    const { data: transcriptResults } = await supabase
      .from("link_transcripts")
      .select(`
        id,
        text,
        start_time,
        end_time,
        link_id,
        links!inner(id, title, url, thumbnail_url, video_url, workspace_id)
      `)
      .eq("links.workspace_id", workspaceId)
      .ilike("text", `%${query}%`)
      .limit(limit);
    
    const linkResults = (transcriptResults || []).map((t: any) => ({
      id: t.link_id,
      document_id: t.link_id,
      title: t.links?.title || "Video",
      description: `[${formatTime(t.start_time)}] ${t.text}`,
      thumbnail_url: t.links?.thumbnail_url,
      video_url: t.links?.video_url,
      url: t.links?.url,
      similarity: 0.8,
      search_type: "transcript",
      result_type: "link",
      start_time: t.start_time,
    }));
    
    // Search in scratches
    const { data: scratchSearchResults } = await supabase
      .from("scratches")
      .select("id, title, thumbnail, searchable_text, tags, created_at")
      .eq("workspace_id", workspaceId)
      .or(`title.ilike.%${query}%,searchable_text.ilike.%${query}%`)
      .limit(limit);
    
    const scratchItems = (scratchSearchResults || []).map((s: any) => ({
      id: s.id,
      document_id: s.id,
      title: s.title || "Untitled Scratch",
      description: s.searchable_text?.slice(0, 200) || "",
      thumbnail_path: s.thumbnail,
      tags: s.tags,
      similarity: 0.75,
      search_type: "text",
      result_type: "scratch",
      created_at: s.created_at,
    }));
    
    // Search in notes
    const { data: noteSearchResults } = await supabase
      .from("notes")
      .select("id, title, searchable_text, tags, created_at")
      .eq("workspace_id", workspaceId)
      .or(`title.ilike.%${query}%,searchable_text.ilike.%${query}%`)
      .limit(limit);
    
    const noteItems = (noteSearchResults || []).map((n: any) => ({
      id: n.id,
      document_id: n.id,
      title: n.title || "Untitled Note",
      description: n.searchable_text?.slice(0, 200) || "",
      tags: n.tags,
      similarity: 0.75,
      search_type: "text",
      result_type: "note",
      created_at: n.created_at,
    }));
    
    // Combine and deduplicate link results
    const uniqueLinkResults = linkResults.filter((lr: any, index: number, self: any[]) => 
      index === self.findIndex((t) => t.id === lr.id)
    );
    
    // Combine all results
    const allResults = [
      ...resultsWithPreviews,
      ...scratchItems,
      ...noteItems,
      ...uniqueLinkResults,
    ].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    // Save search to history - ALWAYS include user_id
    // Delete existing identical query first to prevent duplicates, then insert
    console.log("[Search] Saving to history - userId:", userId || "null", "workspaceId:", workspaceId, "query:", query);

    if (userId) {
      // First delete any existing entry with same query to prevent duplicates
      await supabase
        .from("search_history")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("query", query);
      
      const { data: insertedData, error: historyError } = await supabase
        .from("search_history")
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          query,
          result_count: allResults.length,
          search_type: searchTypes.join(","),
        })
        .select();

      if (historyError) {
        console.error("[Search] Failed to save search history:", historyError.code, historyError.message);
      } else {
        console.log("[Search] Successfully saved search history:", insertedData);
      }
    } else {
      console.warn("[Search] No userId resolved - skipping search history insert");
    }

    return NextResponse.json({
      results: allResults,
      query,
      search_types: searchTypes,
      total: allResults.length,
      has_semantic: queryEmbedding !== null,
    });
  } catch (error) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search?workspaceId=...
 * Get recent searches and suggested queries
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const session = await getServerSession(authOptions);
    const userId = await resolveUserId(req, session);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    console.log("[Search API GET] workspaceId:", workspaceId);

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Get recent searches with IDs for deletion
    const { data: recentSearches, error: searchError } = userId
      ? await supabase
          .from("search_history")
          .select("id, query, result_count, created_at")
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [], error: null };
    
    console.log("[Search API GET] recentSearches:", recentSearches?.length || 0, "error:", searchError?.message || "none");

    // Get popular tags from workspace documents
    const { data: documents } = await supabase
      .from("documents")
      .select("tags")
      .eq("workspace_id", workspaceId)
      .not("tags", "is", null);

    const tagCounts: Record<string, number> = {};
    documents?.forEach((doc: any) => {
      doc.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return NextResponse.json({
      recentSearches: recentSearches || [],
      suggestedTags: popularTags,
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: Extract keywords for precise matching
function extractKeywords(query: string): { colors: string[]; objects: string[]; all: string[] } {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  
  // Comprehensive color list including shades
  const colorKeywords = [
    // Basic colors
    "white", "black", "red", "blue", "green", "yellow", "pink", "purple", 
    "orange", "brown", "gray", "grey", "gold", "silver", "beige", "nude",
    // Red shades
    "crimson", "scarlet", "burgundy", "wine", "cherry", "ruby", "maroon", "coral",
    // Blue shades
    "navy", "azure", "teal", "turquoise", "cobalt", "indigo", "cyan", "aqua",
    // Green shades
    "emerald", "olive", "mint", "sage", "forest", "lime", "jade",
    // Pink/Purple shades
    "magenta", "fuchsia", "lavender", "violet", "mauve", "plum", "rose", "blush",
    // Other shades
    "cream", "ivory", "tan", "khaki", "champagne", "bronze", "copper", "peach",
    // German
    "weiß", "schwarz", "rot", "blau", "grün", "gelb", "rosa", "lila"
  ];
  
  const colors = words.filter(w => colorKeywords.includes(w));
  const objects = words.filter(w => !colorKeywords.includes(w) && w.length > 2);
  
  return { colors, objects, all: words };
}

// Helper: Check if result matches color requirement
function matchesColorRequirement(result: any, colors: string[], objects: string[]): boolean {
  if (colors.length === 0) return true;
  
  const description = (result.description || "").toLowerCase();
  const title = (result.title || "").toLowerCase();
  const tags = (result.tags || []).map((t: string) => t.toLowerCase());
  const summary = (result.ai_summary || "").toLowerCase();
  const searchableText = (result.searchable_text || "").toLowerCase();
  
  // Detailed analysis provides the most precise color matching
  const detailedAnalysis = result.detailed_analysis;
  
  const allText = `${description} ${title} ${tags.join(" ")} ${summary} ${searchableText}`;
  
  // If no text metadata at all, we can't verify color - exclude
  if (!description && !summary && tags.length === 0 && !searchableText) {
    return false;
  }
  
  // Check detailed analysis clothing colors first (MOST RELIABLE)
  if (detailedAnalysis?.clothing) {
    for (const clothing of detailedAnalysis.clothing) {
      const clothingColor = (clothing.color || "").toLowerCase();
      const clothingShade = (clothing.shade || "").toLowerCase();
      const clothingType = (clothing.type || "").toLowerCase();
      
      for (const color of colors) {
        // Check if clothing matches color
        if (clothingColor.includes(color) || clothingShade.includes(color)) {
          // If object is specified, check if clothing type matches
          if (objects.length > 0) {
            for (const obj of objects) {
              if (clothingType.includes(obj) || obj.includes(clothingType)) {
                return true;
              }
            }
          } else {
            return true;
          }
        }
      }
    }
  }
  
  // Check detailed analysis colors
  if (detailedAnalysis?.colors) {
    for (const colorInfo of detailedAnalysis.colors) {
      const colorName = (colorInfo.color || "").toLowerCase();
      const colorShade = (colorInfo.shade || "").toLowerCase();
      const colorLocation = (colorInfo.location || "").toLowerCase();
      
      for (const color of colors) {
        if (colorName.includes(color) || colorShade.includes(color)) {
          if (objects.length > 0) {
            for (const obj of objects) {
              if (colorLocation.includes(obj)) {
                return true;
              }
            }
          } else {
            return true;
          }
        }
      }
    }
  }
  
  // Check tags (combined color+object tags are very reliable)
  for (const color of colors) {
    if (objects.length > 0) {
      for (const obj of objects) {
        // Look for combined tags like "red lingerie"
        const combinedTag = `${color} ${obj}`;
        if (tags.some((tag: string) => tag.includes(combinedTag) || tag.includes(`${obj} ${color}`))) {
          return true;
        }
      }
    }
    
    // Check if color is in tags
    if (tags.some((tag: string) => tag.includes(color))) {
      return true;
    }
  }
  
  // Check if color appears near the object keywords in searchable text
  if (objects.length > 0) {
    for (const color of colors) {
      for (const obj of objects) {
        // Look for patterns like "red lingerie" within ~50 chars
        const colorObjPattern = new RegExp(`${color}.{0,50}${obj}|${obj}.{0,50}${color}`, 'i');
        if (colorObjPattern.test(searchableText) || colorObjPattern.test(description)) {
          return true;
        }
      }
    }
  }
  
  // Fallback: check if color is prominent in text
  for (const color of colors) {
    const colorCount = (allText.match(new RegExp(color, 'gi')) || []).length;
    if (colorCount >= 2) {
      return true;
    }
  }
  
  return false;
}

// Helper: Check if result matches object/content requirement  
function matchesContentRequirement(result: any, objects: string[]): boolean {
  if (objects.length === 0) return true;
  
  const description = (result.description || "").toLowerCase();
  const title = (result.title || "").toLowerCase();
  const tags = (result.tags || []).map((t: string) => t.toLowerCase());
  const summary = (result.ai_summary || "").toLowerCase();
  const searchableText = (result.searchable_text || "").toLowerCase();
  const detailedAnalysis = result.detailed_analysis;
  
  const allText = `${description} ${title} ${tags.join(" ")} ${summary} ${searchableText}`;
  
  // Check detailed analysis for clothing types
  if (detailedAnalysis?.clothing) {
    for (const clothing of detailedAnalysis.clothing) {
      const clothingType = (clothing.type || "").toLowerCase();
      for (const obj of objects) {
        if (clothingType.includes(obj) || obj.includes(clothingType)) {
          return true;
        }
      }
    }
  }
  
  // Check detailed analysis objects
  if (detailedAnalysis?.objects) {
    for (const objInfo of detailedAnalysis.objects) {
      const objName = (objInfo.name || "").toLowerCase();
      for (const obj of objects) {
        if (objName.includes(obj) || obj.includes(objName)) {
          return true;
        }
      }
    }
  }
  
  // Check if at least one required object/keyword is mentioned
  return objects.some(obj => allText.includes(obj));
}

// Helper: Apply precision filtering to improve search accuracy
function applyPrecisionFilter(results: any[], query: string): any[] {
  const keywords = extractKeywords(query);
  const hasColorQuery = keywords.colors.length > 0;
  const hasObjectQuery = keywords.objects.length > 0;
  
  return results
    .map(result => {
      let adjustedSimilarity = result.similarity;
      let shouldInclude = true;
      
      // For visual content searches, prefer images/videos over documents
      const isVisualSearch = hasColorQuery || 
        keywords.all.some(w => ["photo", "image", "picture", "video", "wearing", "person", "woman", "man"].includes(w));
      
      const isImageOrVideo = result.mime_type?.startsWith("image/") || result.mime_type?.startsWith("video/");
      const isPdf = result.mime_type === "application/pdf";
      
      // Penalize PDFs in visual searches
      if (isVisualSearch && isPdf) {
        adjustedSimilarity *= 0.3; // Heavy penalty for PDFs in visual searches
      }
      
      // Boost images/videos in visual searches
      if (isVisualSearch && isImageOrVideo) {
        adjustedSimilarity *= 1.1;
      }
      
      // Color matching: if searching for a specific color, it MUST be in the description
      if (hasColorQuery) {
        const matchesColor = matchesColorRequirement(result, keywords.colors, keywords.objects);
        if (!matchesColor) {
          // STRICT: If color is specified, result MUST have that color - exclude otherwise
          shouldInclude = false;
        }
      }
      
      // Object/content matching
      if (hasObjectQuery && !matchesContentRequirement(result, keywords.objects)) {
        adjustedSimilarity *= 0.6;
      }
      
      // Apply minimum threshold
      if (adjustedSimilarity < 0.35) {
        shouldInclude = false;
      }
      
      return shouldInclude ? { ...result, similarity: Math.min(adjustedSimilarity, 1) } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.similarity - a.similarity);
}

// Helper: Deduplicate search results keeping highest similarity
function deduplicateResults(results: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const result of results) {
    const key = result.document_id;
    const existing = seen.get(key);
    
    if (!existing || result.similarity > existing.similarity) {
      seen.set(key, result);
    }
  }
  
  return Array.from(seen.values()).sort((a, b) => b.similarity - a.similarity);
}

// Helper: Add signed preview URLs from Railway Storage
/**
 * DELETE /api/search?id=...
 * Delete a search history entry
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const workspaceId = searchParams.get("workspaceId");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true" && workspaceId) {
      // Clear all search history for workspace
      const { error } = await supabase
        .from("search_history")
        .delete()
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("Failed to clear search history:", error);
        return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete search history:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete search history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function addPreviewUrls(supabase: any, results: any[]): Promise<any[]> {
  const storage = getRailwayStorage();
  
  return Promise.all(
    results.map(async (result: any) => {
      let previewUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      // Generate preview URL for the main file from Railway Storage
      if (result.storage_path) {
        const isImage = result.mime_type?.startsWith("image/");
        const isPdf = result.mime_type === "application/pdf";
        const isVideo = result.mime_type?.startsWith("video/");
        
        if (isImage || isPdf || isVideo) {
          const { signedUrl } = await storage.createSignedUrl(result.storage_path, 60 * 60);
          
          if (signedUrl) {
            previewUrl = signedUrl;
          }
        }
      }

      // Generate thumbnail URL if available
      if (result.thumbnail_path) {
        const { signedUrl: thumbSignedUrl } = await storage.createSignedUrl(result.thumbnail_path, 60 * 60);
        
        if (thumbSignedUrl) {
          thumbnailUrl = thumbSignedUrl;
        }
      }

      return {
        ...result,
        previewUrl,
        thumbnailUrl: thumbnailUrl || previewUrl,
      };
    })
  );
}
