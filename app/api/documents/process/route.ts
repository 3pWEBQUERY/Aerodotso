import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  generateAITags, 
  generateAISummary,
  generateQueryEmbedding 
} from "@/lib/visual-embeddings";
import { analyzeImage, type AnalysisResult } from "@/lib/multi-model-analyzer";

/**
 * POST /api/documents/process
 * Process a document after upload - generates embeddings, tags, summary
 * Uses multi-model AI analysis for EXTREME detail and precise search
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { documentId, quality = "standard" } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Get the document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const mimeType = document.mime_type || "";
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");
    const isPdf = mimeType === "application/pdf";
    const isText = mimeType.startsWith("text/") || mimeType === "application/json";

    let embedding: number[] | null = null;
    let description: string | null = null;
    let tags: string[] = [];
    let summary: string | null = null;
    let detailedAnalysis: any = null;
    let searchableText: string | null = null;
    let modelUsed: string | null = null;

    // Generate signed URL for processing
    let fileUrl: string | null = null;
    if (document.storage_path) {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 60 * 60);
      fileUrl = signed?.signedUrl || null;
    }

    // Process based on file type
    if (isImage && fileUrl) {
      // Use multi-model analyzer for EXTREME detail
      try {
        console.log(`Processing image ${documentId} with multi-model analyzer...`);
        
        const analysisResult: AnalysisResult = await analyzeImage(fileUrl, {
          quality: quality as "premium" | "standard",
          preferredProvider: "auto",
        });

        description = analysisResult.description;
        tags = analysisResult.tags;
        detailedAnalysis = analysisResult.detailedAnalysis;
        searchableText = analysisResult.searchableText;
        modelUsed = analysisResult.modelUsed;

        console.log(`Analysis complete: ${tags.length} tags, model: ${modelUsed}`);

        // Generate embedding from the detailed searchable text
        embedding = await generateQueryEmbedding(
          `${description} ${searchableText}`
        );

        // Store image embedding for visual search
        if (embedding) {
          await supabase.from("image_embeddings").upsert({
            document_id: documentId,
            frame_index: 0,
            thumbnail_path: document.storage_path,
            embedding: `[${embedding.join(",")}]`,
          }, { onConflict: "document_id,frame_index" });
        }

        // Generate summary from detailed analysis
        summary = generateDetailedSummary(analysisResult);

      } catch (error) {
        console.error("Multi-model image processing failed:", error);
        // Fallback to basic processing
        try {
          embedding = await generateQueryEmbedding(document.title);
          tags = await generateAITags(document.title, mimeType);
        } catch (fallbackError) {
          console.error("Fallback processing also failed:", fallbackError);
        }
      }
    } else if (isText || isPdf) {
      // For text documents, generate text embedding
      try {
        const textContent = `${document.title} ${document.description || ""}`;
        embedding = await generateQueryEmbedding(textContent);
        tags = await generateAITags(textContent, mimeType);
        summary = await generateAISummary(textContent, document.title);
      } catch (error) {
        console.error("Text processing failed:", error);
      }
    } else if (isVideo) {
      try {
        const textContent = `Video: ${document.title}`;
        embedding = await generateQueryEmbedding(textContent);
        tags = await generateAITags(textContent, mimeType);
      } catch (error) {
        console.error("Video processing failed:", error);
      }
    } else {
      try {
        embedding = await generateQueryEmbedding(document.title);
        tags = await generateAITags(document.title, mimeType);
      } catch (error) {
        console.error("Generic processing failed:", error);
      }
    }

    // Update document with generated data
    const updateData: Record<string, any> = {
      processed_at: new Date().toISOString(),
    };
    
    if (embedding) {
      updateData.embedding = `[${embedding.join(",")}]`;
    }
    if (description) {
      updateData.description = description;
    }
    if (tags.length > 0) {
      updateData.tags = tags;
    }
    if (summary) {
      updateData.ai_summary = summary;
    }
    if (detailedAnalysis) {
      updateData.detailed_analysis = detailedAnalysis;
    }
    if (searchableText) {
      updateData.searchable_text = searchableText;
    }
    if (modelUsed) {
      updateData.analysis_model = modelUsed;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("documents")
        .update(updateData)
        .eq("id", documentId);

      if (updateError) {
        console.error("Document update error:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        hasEmbedding: !!embedding,
        hasDescription: !!description,
        tagsCount: tags.length,
        hasSummary: !!summary,
        hasDetailedAnalysis: !!detailedAnalysis,
        modelUsed,
      },
    });
  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Generate a detailed summary from the analysis result
 */
function generateDetailedSummary(analysis: AnalysisResult): string {
  const parts: string[] = [analysis.description];

  // Add clothing details
  const clothing = analysis.detailedAnalysis.clothing;
  if (clothing && clothing.length > 0) {
    const clothingDesc = clothing.map(c => 
      `${c.shade || c.color} ${c.type}${c.material ? ` (${c.material})` : ""}`
    ).join(", ");
    parts.push(`Clothing: ${clothingDesc}`);
  }

  // Add setting
  const setting = analysis.detailedAnalysis.setting;
  if (setting && setting.location) {
    parts.push(`Setting: ${setting.type} - ${setting.location}`);
  }

  // Add mood
  const mood = analysis.detailedAnalysis.mood;
  if (mood && mood.length > 0) {
    parts.push(`Mood: ${mood.slice(0, 3).join(", ")}`);
  }

  return parts.join(". ");
}
