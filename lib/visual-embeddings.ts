/**
 * Visual embeddings for image and video search
 * Uses Google Gemini API for vision and embeddings
 */

const VISUAL_EMBEDDING_DIMENSION = 768; // Gemini embedding dimension
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await delay(waitTime);
      }
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Only retry on rate limit errors
      if (!error.message?.includes('429') && !error.message?.includes('rate')) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

interface VisualEmbeddingResult {
  embedding: number[];
  description?: string;
}

/**
 * Generate embedding for an image using Gemini vision model
 */
export async function generateImageEmbedding(
  imageUrl: string
): Promise<VisualEmbeddingResult> {
  return withRetry(async () => {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // First, get a description of the image using Gemini Vision
    const descriptionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Describe this image in detail for search indexing. Include: main subjects, colors (be specific about clothing colors), actions, text visible, mood, style, objects, setting. Be comprehensive but concise. Output only the description." },
              { inline_data: { mime_type: mimeType, data: base64Image } }
            ]
          }],
          generationConfig: { maxOutputTokens: 500 }
        }),
      }
    );

    if (!descriptionResponse.ok) {
      const errorText = await descriptionResponse.text();
      console.error("Gemini Vision API Error:", errorText);
      throw new Error(`Vision API error: ${descriptionResponse.status}`);
    }

    const descriptionJson = await descriptionResponse.json();
    const description = descriptionJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Now generate embedding from the description using Gemini
    const embeddingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: description }] }
        }),
      }
    );

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Gemini Embedding API Error:", errorText);
      throw new Error(`Embedding error: ${embeddingResponse.status}`);
    }

    const embeddingJson = await embeddingResponse.json();
    const embedding = embeddingJson.embedding?.values || [];

    return { embedding, description };
  });
}

/**
 * Generate embeddings for multiple video frames
 */
export async function generateVideoFrameEmbeddings(
  frameUrls: { url: string; timestamp: number }[]
): Promise<{ embedding: number[]; description: string; timestamp: number }[]> {
  const results = [];
  
  for (const frame of frameUrls) {
    try {
      const result = await generateImageEmbedding(frame.url);
      results.push({
        embedding: result.embedding,
        description: result.description || "",
        timestamp: frame.timestamp,
      });
    } catch (error) {
      console.error(`Failed to process frame at ${frame.timestamp}s:`, error);
    }
  }
  
  return results;
}

/**
 * Generate embedding for a search query (text-based visual search)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  return withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    return json.embedding?.values || [];
  });
}

/**
 * Generate AI tags for a document based on its content
 */
export async function generateAITags(
  content: string,
  mimeType?: string
): Promise<string[]> {
  try {
    return await withRetry(async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a tagging assistant. Generate 3-8 relevant, specific tags for the given content. Output only lowercase tags separated by commas, nothing else.\n\nContent type: ${mimeType || "unknown"}\n\nContent:\n${content.slice(0, 2000)}`
              }]
            }],
            generationConfig: { maxOutputTokens: 100 }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Tag API error: ${response.status}`);
      }

      const json = await response.json();
      const tagString = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      return tagString
        .split(",")
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0 && tag.length < 50);
    });
  } catch (error) {
    console.error("Tag generation failed after retries:", error);
    return [];
  }
}

/**
 * Generate AI summary for a document
 */
export async function generateAISummary(
  content: string,
  title?: string
): Promise<string> {
  try {
    return await withRetry(async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a summarization assistant. Create a concise 1-2 sentence summary of the content. Focus on the key points and main topic. Output only the summary.\n\n${title ? `Title: ${title}\n\n` : ""}Content:\n${content.slice(0, 4000)}`
              }]
            }],
            generationConfig: { maxOutputTokens: 150 }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Summary API error: ${response.status}`);
      }

      const json = await response.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
    });
  } catch (error) {
    console.error("Summary generation failed after retries:", error);
    return "";
  }
}

export { VISUAL_EMBEDDING_DIMENSION };
