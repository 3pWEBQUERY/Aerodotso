/**
 * Multi-Model Vision Analyzer for Miza
 * Intelligent model selection with cost optimization
 * 
 * Models:
 * - Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) - Highest quality, expensive
 * - Claude Haiku 4.5 (claude-haiku-4-5-20251001) - Fast and cheap
 * - Gemini 2.5 Pro - Great for images
 * - Gemini 2.0 Flash - Fast and cheap
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Model costs per 1M tokens (approximate)
const MODEL_COSTS = {
  "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  "gemini-2.5-pro-preview-06-05": { input: 1.25, output: 5 },
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
} as const;

type ModelId = keyof typeof MODEL_COSTS;

// Model quality tiers
const QUALITY_TIERS = {
  premium: ["claude-sonnet-4-5-20250929", "gemini-2.5-pro-preview-06-05"],
  standard: ["claude-haiku-4-5-20251001", "gemini-2.0-flash"],
} as const;

export interface AnalysisResult {
  description: string;
  detailedAnalysis: DetailedAnalysis;
  tags: string[];
  searchableText: string;
  modelUsed: string;
  processingTimeMs: number;
  confidence: number;
}

export interface DetailedAnalysis {
  // Core visual elements
  subjects: SubjectInfo[];
  colors: ColorInfo[];
  objects: ObjectInfo[];
  
  // Context and setting
  setting: SettingInfo;
  mood: string[];
  style: string[];
  
  // Specific attributes for precise search
  clothing: ClothingInfo[];
  text: TextInfo[];
  actions: string[];
  
  // Technical
  composition: string;
  lighting: string;
  quality: string;
}

interface SubjectInfo {
  type: string; // person, animal, object, etc.
  description: string;
  position: string; // center, left, right, background
  attributes: string[];
}

interface ColorInfo {
  color: string;
  shade: string; // dark red, light blue, etc.
  location: string; // what has this color
  prominence: "dominant" | "secondary" | "accent";
}

interface ObjectInfo {
  name: string;
  description: string;
  attributes: string[];
}

interface SettingInfo {
  type: string; // indoor, outdoor, studio, etc.
  location: string; // bedroom, beach, office, etc.
  background: string;
  environment: string[];
}

interface ClothingInfo {
  type: string; // dress, shirt, lingerie, etc.
  color: string;
  shade: string;
  material?: string;
  style?: string;
  brand?: string;
  details: string[];
}

interface TextInfo {
  content: string;
  type: string; // title, label, watermark, etc.
  location: string;
}

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

/**
 * Intelligent model selection based on image characteristics
 */
function selectModel(
  imageSize: number,
  mimeType: string,
  quality: "premium" | "standard" = "standard"
): { claude: ModelId; gemini: ModelId } {
  // Use premium models for larger/complex images
  const usePremium = quality === "premium" || imageSize > 2 * 1024 * 1024;
  
  if (usePremium) {
    return {
      claude: "claude-sonnet-4-5-20250929",
      gemini: "gemini-2.5-pro-preview-06-05",
    };
  }
  
  return {
    claude: "claude-haiku-4-5-20251001",
    gemini: "gemini-2.0-flash",
  };
}

/**
 * The ultra-detailed analysis prompt for precise search
 */
const ANALYSIS_PROMPT = `You are an expert image analyst. Analyze this image with EXTREME DETAIL for search indexing.

Your goal: Enable precise searches like "red lingerie", "blue dress at beach", "person holding coffee".

Output a JSON object with this EXACT structure:
{
  "description": "A comprehensive 2-3 sentence description of the image",
  "subjects": [
    {
      "type": "person|animal|object|scene",
      "description": "detailed description",
      "position": "center|left|right|top|bottom|background|foreground",
      "attributes": ["specific attributes like age range, gender presentation, pose, expression"]
    }
  ],
  "colors": [
    {
      "color": "exact color name",
      "shade": "specific shade (e.g., 'burgundy red', 'navy blue', 'pastel pink')",
      "location": "what object/element has this color",
      "prominence": "dominant|secondary|accent"
    }
  ],
  "objects": [
    {
      "name": "object name",
      "description": "detailed description",
      "attributes": ["material", "size", "condition", "style"]
    }
  ],
  "setting": {
    "type": "indoor|outdoor|studio|abstract",
    "location": "specific location type",
    "background": "description of background",
    "environment": ["environmental details"]
  },
  "mood": ["mood descriptors"],
  "style": ["artistic style, photography style"],
  "clothing": [
    {
      "type": "specific clothing type (e.g., 'lingerie set', 'cocktail dress', 't-shirt')",
      "color": "primary color",
      "shade": "specific shade (e.g., 'cherry red', 'wine red', 'crimson')",
      "material": "fabric if visible",
      "style": "style descriptor",
      "details": ["lace trim", "v-neck", "sleeveless", etc.]
    }
  ],
  "text": [
    {
      "content": "exact text visible",
      "type": "title|label|watermark|sign|logo",
      "location": "where in image"
    }
  ],
  "actions": ["what subjects are doing"],
  "composition": "how the image is composed",
  "lighting": "lighting description",
  "quality": "image quality assessment"
}

BE EXTREMELY SPECIFIC about colors and clothing:
- Don't just say "red" - say "burgundy red", "cherry red", "crimson", "scarlet", "wine red"
- For clothing, include EVERY visible detail: cut, neckline, length, material, pattern
- If it's lingerie, specify: bra type, panty type, set or separate, lace/satin/mesh

Output ONLY the JSON, no markdown, no explanation.`;

/**
 * Analyze image with Claude
 */
async function analyzeWithClaude(
  imageBase64: string,
  mimeType: string,
  model: ModelId
): Promise<AnalysisResult | null> {
  if (!ANTHROPIC_API_KEY) {
    console.log("Anthropic API key not configured");
    return null;
  }

  const startTime = Date.now();
  
  try {
    return await withRetry(async () => {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: ANALYSIS_PROMPT,
              },
            ],
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const json = await response.json();
      let content = json.content?.[0]?.text || "";
      
      // Clean up markdown code blocks if present (Claude sometimes wraps JSON in ```json ... ```)
      content = content.trim();
      if (content.startsWith("```json")) {
        content = content.slice(7); // Remove ```json
      } else if (content.startsWith("```")) {
        content = content.slice(3); // Remove ```
      }
      if (content.endsWith("```")) {
        content = content.slice(0, -3); // Remove trailing ```
      }
      content = content.trim();
      
      // Parse JSON response
      const parsed = JSON.parse(content);
      const processingTime = Date.now() - startTime;

      return {
        description: parsed.description || "",
        detailedAnalysis: {
          subjects: parsed.subjects || [],
          colors: parsed.colors || [],
          objects: parsed.objects || [],
          setting: parsed.setting || { type: "", location: "", background: "", environment: [] },
          mood: parsed.mood || [],
          style: parsed.style || [],
          clothing: parsed.clothing || [],
          text: parsed.text || [],
          actions: parsed.actions || [],
          composition: parsed.composition || "",
          lighting: parsed.lighting || "",
          quality: parsed.quality || "",
        },
        tags: generateTagsFromAnalysis(parsed),
        searchableText: generateSearchableText(parsed),
        modelUsed: model,
        processingTimeMs: processingTime,
        confidence: 0.95,
      };
    });
  } catch (error) {
    console.error("Claude analysis failed:", error);
    return null;
  }
}

/**
 * Analyze image with Gemini
 */
async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  model: ModelId
): Promise<AnalysisResult | null> {
  if (!GEMINI_API_KEY) {
    console.log("Gemini API key not configured");
    return null;
  }

  const startTime = Date.now();
  const geminiModel = model === "gemini-2.5-pro-preview-06-05" 
    ? "gemini-2.5-pro-preview-06-05" 
    : "gemini-2.0-flash";

  try {
    return await withRetry(async () => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: ANALYSIS_PROMPT },
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
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Clean and parse JSON
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      const processingTime = Date.now() - startTime;

      return {
        description: parsed.description || "",
        detailedAnalysis: {
          subjects: parsed.subjects || [],
          colors: parsed.colors || [],
          objects: parsed.objects || [],
          setting: parsed.setting || { type: "", location: "", background: "", environment: [] },
          mood: parsed.mood || [],
          style: parsed.style || [],
          clothing: parsed.clothing || [],
          text: parsed.text || [],
          actions: parsed.actions || [],
          composition: parsed.composition || "",
          lighting: parsed.lighting || "",
          quality: parsed.quality || "",
        },
        tags: generateTagsFromAnalysis(parsed),
        searchableText: generateSearchableText(parsed),
        modelUsed: model,
        processingTimeMs: processingTime,
        confidence: 0.9,
      };
    });
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
}

/**
 * Generate tags from detailed analysis
 */
function generateTagsFromAnalysis(analysis: any): string[] {
  const tags: Set<string> = new Set();

  // Add colors with shades
  for (const color of analysis.colors || []) {
    tags.add(color.color?.toLowerCase());
    tags.add(color.shade?.toLowerCase());
  }

  // Add clothing types and colors
  for (const clothing of analysis.clothing || []) {
    tags.add(clothing.type?.toLowerCase());
    tags.add(clothing.color?.toLowerCase());
    if (clothing.shade) tags.add(clothing.shade.toLowerCase());
    if (clothing.material) tags.add(clothing.material.toLowerCase());
    if (clothing.style) tags.add(clothing.style.toLowerCase());
    
    // Combined tags for precise search
    if (clothing.color && clothing.type) {
      tags.add(`${clothing.color} ${clothing.type}`.toLowerCase());
    }
    if (clothing.shade && clothing.type) {
      tags.add(`${clothing.shade} ${clothing.type}`.toLowerCase());
    }
  }

  // Add subjects
  for (const subject of analysis.subjects || []) {
    tags.add(subject.type?.toLowerCase());
    for (const attr of subject.attributes || []) {
      tags.add(attr.toLowerCase());
    }
  }

  // Add objects
  for (const obj of analysis.objects || []) {
    tags.add(obj.name?.toLowerCase());
  }

  // Add setting
  if (analysis.setting) {
    tags.add(analysis.setting.type?.toLowerCase());
    tags.add(analysis.setting.location?.toLowerCase());
  }

  // Add mood and style
  for (const mood of analysis.mood || []) {
    tags.add(mood.toLowerCase());
  }
  for (const style of analysis.style || []) {
    tags.add(style.toLowerCase());
  }

  // Add actions
  for (const action of analysis.actions || []) {
    tags.add(action.toLowerCase());
  }

  // Clean up and return
  return Array.from(tags)
    .filter(tag => tag && tag.length > 1 && tag.length < 50)
    .slice(0, 50);
}

/**
 * Generate searchable text from analysis
 */
function generateSearchableText(analysis: any): string {
  const parts: string[] = [];

  // Description
  if (analysis.description) {
    parts.push(analysis.description);
  }

  // Clothing details (crucial for precise search)
  for (const clothing of analysis.clothing || []) {
    const clothingDesc = [
      clothing.shade || clothing.color,
      clothing.material,
      clothing.style,
      clothing.type,
      ...(clothing.details || [])
    ].filter(Boolean).join(" ");
    if (clothingDesc) parts.push(clothingDesc);
  }

  // Colors with context
  for (const color of analysis.colors || []) {
    parts.push(`${color.shade || color.color} ${color.location}`);
  }

  // Subjects
  for (const subject of analysis.subjects || []) {
    parts.push(`${subject.type}: ${subject.description}`);
  }

  // Setting
  if (analysis.setting) {
    parts.push(`${analysis.setting.type} ${analysis.setting.location} ${analysis.setting.background}`);
  }

  // Actions
  parts.push(...(analysis.actions || []));

  return parts.filter(Boolean).join(". ").toLowerCase();
}

/**
 * Main analysis function with intelligent model selection and fallback
 */
export async function analyzeImage(
  imageUrl: string,
  options: {
    quality?: "premium" | "standard";
    preferredProvider?: "claude" | "gemini" | "auto";
  } = {}
): Promise<AnalysisResult> {
  const { quality = "standard", preferredProvider = "auto" } = options;

  // Fetch image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const imageSize = imageBuffer.byteLength;

  // Select models
  const models = selectModel(imageSize, mimeType, quality);

  let result: AnalysisResult | null = null;

  // Try preferred provider first, then fallback
  if (preferredProvider === "claude" || preferredProvider === "auto") {
    result = await analyzeWithClaude(base64Image, mimeType, models.claude);
  }

  if (!result && (preferredProvider === "gemini" || preferredProvider === "auto")) {
    result = await analyzeWithGemini(base64Image, mimeType, models.gemini);
  }

  // If still no result, try the other provider
  if (!result) {
    if (preferredProvider === "claude") {
      result = await analyzeWithGemini(base64Image, mimeType, models.gemini);
    } else {
      result = await analyzeWithClaude(base64Image, mimeType, models.claude);
    }
  }

  if (!result) {
    throw new Error("All analysis models failed");
  }

  return result;
}

/**
 * Batch analyze multiple images with cost optimization
 */
export async function batchAnalyzeImages(
  imageUrls: string[],
  options: {
    quality?: "premium" | "standard";
    maxConcurrent?: number;
    delayBetweenMs?: number;
  } = {}
): Promise<Map<string, AnalysisResult>> {
  const { 
    quality = "standard", 
    maxConcurrent = 3, 
    delayBetweenMs = 1000 
  } = options;

  const results = new Map<string, AnalysisResult>();
  const queue = [...imageUrls];
  const inProgress: Promise<void>[] = [];

  const processNext = async () => {
    const url = queue.shift();
    if (!url) return;

    try {
      const result = await analyzeImage(url, { quality });
      results.set(url, result);
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error);
    }

    // Add delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, delayBetweenMs));
  };

  while (queue.length > 0 || inProgress.length > 0) {
    while (inProgress.length < maxConcurrent && queue.length > 0) {
      const promise = processNext().then(() => {
        const index = inProgress.indexOf(promise);
        if (index > -1) inProgress.splice(index, 1);
      });
      inProgress.push(promise);
    }

    if (inProgress.length > 0) {
      await Promise.race(inProgress);
    }
  }

  return results;
}

export { MODEL_COSTS, QUALITY_TIERS };
