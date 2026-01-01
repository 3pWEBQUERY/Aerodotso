/**
 * Gemini Analyzer - Uses gemini-3-flash-preview exclusively for all AI analysis
 * Provides image analysis, text generation, and search indexing
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

// Retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const waitTime = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry ${attempt}/${maxRetries}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (!error.message?.includes('429') && !error.message?.includes('rate') && !error.message?.includes('overloaded')) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

export interface ImageAnalysisResult {
  description: string;
  detailedDescription: string;
  tags: string[];
  searchableText: string;
  subjects: string[];
  colors: string[];
  objects: string[];
  actions: string[];
  mood: string[];
  textContent: string[];
}

export interface NoteGenerationResult {
  title: string;
  content: string;
  tags: string[];
}

/**
 * Analyze an image using Gemini 2.0 Flash
 */
export async function analyzeImageWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<ImageAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                text: `Analyze this image in detail for search indexing. Output a JSON object with this exact structure:
{
  "description": "A brief 1-2 sentence description",
  "detailedDescription": "A comprehensive 3-5 sentence description covering all visual elements",
  "tags": ["relevant", "tags", "for", "searching"],
  "subjects": ["main subjects in the image"],
  "colors": ["dominant colors with shades like 'dark blue', 'light pink'"],
  "objects": ["objects visible in the image"],
  "actions": ["actions or activities shown"],
  "mood": ["mood or atmosphere descriptors"],
  "textContent": ["any text visible in the image"]
}

Be extremely detailed about colors, objects, and any text visible. This data will be used for search, so include synonyms and related terms.
Output ONLY the JSON, no markdown or explanation.` 
              },
              { inline_data: { mime_type: mimeType, data: imageBase64 } }
            ]
          }],
          generationConfig: { maxOutputTokens: 2000 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    let content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean markdown if present
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    } else if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();
    
    const parsed = JSON.parse(content);
    
    // Generate searchable text from all fields
    const searchableText = [
      parsed.description,
      parsed.detailedDescription,
      ...(parsed.tags || []),
      ...(parsed.subjects || []),
      ...(parsed.colors || []),
      ...(parsed.objects || []),
      ...(parsed.actions || []),
      ...(parsed.mood || []),
      ...(parsed.textContent || []),
    ].filter(Boolean).join(" ").toLowerCase();

    return {
      description: parsed.description || "",
      detailedDescription: parsed.detailedDescription || "",
      tags: parsed.tags || [],
      searchableText,
      subjects: parsed.subjects || [],
      colors: parsed.colors || [],
      objects: parsed.objects || [],
      actions: parsed.actions || [],
      mood: parsed.mood || [],
      textContent: parsed.textContent || [],
    };
  });
}

/**
 * Generate a note from an image analysis using Gemini 2.0 Flash
 */
export async function generateNoteFromImage(
  imageBase64: string,
  mimeType: string,
  analysisResult?: ImageAnalysisResult
): Promise<NoteGenerationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  return withRetry(async () => {
    const contextInfo = analysisResult 
      ? `\n\nImage analysis context:\n${JSON.stringify(analysisResult, null, 2)}`
      : "";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                text: `Based on this image, create a detailed note that captures all important information. Output a JSON object:
{
  "title": "A descriptive title for the note",
  "content": "Detailed markdown content describing what's in the image, its significance, any text visible, colors, objects, and anything noteworthy. Use bullet points and formatting for clarity.",
  "tags": ["relevant", "tags"]
}
${contextInfo}
Output ONLY the JSON, no markdown wrapper.` 
              },
              { inline_data: { mime_type: mimeType, data: imageBase64 } }
            ]
          }],
          generationConfig: { maxOutputTokens: 2000 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    let content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean markdown if present
    content = content.trim();
    if (content.startsWith("```json")) {
      content = content.slice(7);
    } else if (content.startsWith("```")) {
      content = content.slice(3);
    }
    if (content.endsWith("```")) {
      content = content.slice(0, -3);
    }
    content = content.trim();
    
    const parsed = JSON.parse(content);

    return {
      title: parsed.title || "Uploaded Image Note",
      content: parsed.content || "",
      tags: parsed.tags || [],
    };
  });
}

/**
 * Generate searchable text for any content using Gemini 2.0 Flash
 */
export async function generateSearchableText(
  content: string,
  contentType: "note" | "scratch" | "canvas" | "document"
): Promise<{ searchableText: string; tags: string[]; summary: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this ${contentType} content for search indexing. Output a JSON object:
{
  "searchableText": "All important keywords, concepts, and terms from the content that should be searchable, space-separated",
  "tags": ["relevant", "tags", "for", "categorization"],
  "summary": "A brief 1-2 sentence summary of the content"
}

Content to analyze:
${content.slice(0, 8000)}

Output ONLY the JSON, no markdown.`
            }]
          }],
          generationConfig: { maxOutputTokens: 1000 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    let responseContent = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean markdown if present
    responseContent = responseContent.trim();
    if (responseContent.startsWith("```json")) {
      responseContent = responseContent.slice(7);
    } else if (responseContent.startsWith("```")) {
      responseContent = responseContent.slice(3);
    }
    if (responseContent.endsWith("```")) {
      responseContent = responseContent.slice(0, -3);
    }
    responseContent = responseContent.trim();
    
    const parsed = JSON.parse(responseContent);

    return {
      searchableText: parsed.searchableText || "",
      tags: parsed.tags || [],
      summary: parsed.summary || "",
    };
  });
}

/**
 * Analyze content for semantic search embedding
 */
export async function generateContentEmbeddingText(
  title: string,
  content: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create a rich semantic description for embedding this content. Include the main topics, concepts, entities, and key information.

Title: ${title}
Content: ${content.slice(0, 4000)}

Output only the semantic description text, no JSON or formatting.`
            }]
          }],
          generationConfig: { maxOutputTokens: 500 }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  });
}

export { GEMINI_MODEL };
