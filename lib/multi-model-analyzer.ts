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
  "gemini-3-pro-preview": { input: 1.25, output: 5 },
  "gemini-3-flash-preview": { input: 0.075, output: 0.3 },
} as const;

type ModelId = keyof typeof MODEL_COSTS;

// Model quality tiers
const QUALITY_TIERS = {
  premium: ["gemini-3-pro-preview"],
  standard: ["gemini-3-flash-preview"],
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
 * Only uses Gemini models: gemini-3-pro-preview and gemini-3-flash-preview
 */
function selectModel(
  imageSize: number,
  mimeType: string,
  quality: "premium" | "standard" = "standard"
): { gemini: ModelId } {
  // Use premium models for larger/complex images
  const usePremium = quality === "premium" || imageSize > 2 * 1024 * 1024;
  
  if (usePremium) {
    return {
      gemini: "gemini-3-pro-preview",
    };
  }
  
  return {
    gemini: "gemini-3-flash-preview",
  };
}

/**
 * The ultra-detailed analysis prompt for precise search
 */
const ANALYSIS_PROMPT = `You are an expert image analyst with deep knowledge of brands, products, and fashion. Analyze this image with EXTREME DETAIL for search indexing.

Your goal: Enable precise searches like "Apple AirPods Max", "Nike Air Jordan 1", "Louis Vuitton bag", "red lingerie".

CRITICAL: Identify specific BRANDS and PRODUCT MODELS whenever possible:
- Tech: Apple AirPods Max, Apple Watch Ultra, Samsung Galaxy Buds, Sony WH-1000XM5, Bose QuietComfort
- Phones: iPhone 15 Pro, Samsung Galaxy S24, Google Pixel 8
- Fashion: Nike Air Force 1, Adidas Yeezy, Gucci, Prada, Louis Vuitton, Chanel
- Cars: BMW M3, Mercedes AMG, Porsche 911, Tesla Model S
- Watches: Rolex Submariner, Apple Watch, Omega Seamaster
- Other: MacBook Pro, iPad Pro, PlayStation 5, Nintendo Switch

Output a JSON object with this EXACT structure:
{
  "description": "A comprehensive 2-3 sentence description including any identified brands/products",
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
      "shade": "specific shade (e.g., 'burgundy red', 'navy blue', 'space gray', 'silver')",
      "location": "what object/element has this color",
      "prominence": "dominant|secondary|accent"
    }
  ],
  "objects": [
    {
      "name": "SPECIFIC product name with brand if identifiable (e.g., 'Apple AirPods Max' not just 'headphones')",
      "brand": "brand name if identifiable",
      "model": "specific model if identifiable",
      "description": "detailed description",
      "attributes": ["material", "size", "condition", "style", "color variant"]
    }
  ],
  "products": [
    {
      "brand": "brand name (Apple, Nike, Samsung, etc.)",
      "product": "product name (AirPods Max, Air Force 1, Galaxy Watch)",
      "model": "specific model/variant if visible",
      "color": "color variant (Space Gray, Midnight, etc.)",
      "category": "electronics|fashion|automotive|accessories|other"
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
      "type": "specific clothing type",
      "brand": "brand if identifiable (Nike, Adidas, Zara, H&M, etc.)",
      "color": "primary color",
      "shade": "specific shade",
      "material": "fabric if visible",
      "style": "style descriptor",
      "details": ["lace trim", "v-neck", "sleeveless", "logo visible", etc.]
    }
  ],
  "text": [
    {
      "content": "exact text visible",
      "type": "title|label|watermark|sign|logo|brand",
      "location": "where in image"
    }
  ],
  "actions": ["what subjects are doing"],
  "composition": "how the image is composed",
  "lighting": "lighting description",
  "quality": "image quality assessment"
}

BE EXTREMELY SPECIFIC:
- ALWAYS try to identify brands and exact product models
- Don't say "headphones" - say "Apple AirPods Max in Space Gray" or "Sony WH-1000XM5"
- Don't say "sneakers" - say "Nike Air Jordan 1 Retro High" or "Adidas Ultraboost"
- Don't say "watch" - say "Apple Watch Ultra" or "Rolex Submariner"
- For colors, use specific shades: "burgundy red", "space gray", "midnight blue"
- For clothing, include brand if visible and EVERY detail

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
  const geminiModel = model === "gemini-3-pro-preview" 
    ? "gemini-3-pro-preview" 
    : "gemini-3-flash-preview";

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
            generationConfig: { maxOutputTokens: 4096 }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const json = await response.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Clean and parse JSON with robust error handling
      let cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Try to parse, with fallback for truncated JSON
      let parsed: any;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (parseError) {
        // Try to repair truncated JSON by closing open structures
        console.log("Attempting to repair truncated JSON...");
        let repairedJson = cleanContent;
        
        // Count open brackets and braces
        const openBraces = (repairedJson.match(/{/g) || []).length;
        const closeBraces = (repairedJson.match(/}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/]/g) || []).length;
        
        // Remove trailing incomplete string/value
        repairedJson = repairedJson.replace(/,\s*"[^"]*$/, '');
        repairedJson = repairedJson.replace(/,\s*$/, '');
        repairedJson = repairedJson.replace(/:\s*"[^"]*$/, ': ""');
        
        // Close missing brackets and braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repairedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repairedJson += '}';
        }
        
        try {
          parsed = JSON.parse(repairedJson);
          console.log("JSON repair successful");
        } catch {
          // If repair fails, create minimal fallback
          console.log("JSON repair failed, using fallback");
          parsed = {
            description: "Image analysis incomplete",
            subjects: [],
            colors: [],
            objects: [],
            setting: { type: "unknown", location: "", background: "", environment: [] },
            mood: [],
            style: [],
            clothing: [],
            text: [],
            actions: [],
          };
        }
      }
      
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
        confidence: parsed.description ? 0.9 : 0.5,
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

  // Add clothing types, brands, and colors
  for (const clothing of analysis.clothing || []) {
    tags.add(clothing.type?.toLowerCase());
    tags.add(clothing.color?.toLowerCase());
    if (clothing.brand) tags.add(clothing.brand.toLowerCase());
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
    if (clothing.brand && clothing.type) {
      tags.add(`${clothing.brand} ${clothing.type}`.toLowerCase());
    }
  }

  // Add products with brands (CRITICAL for specific searches)
  for (const product of analysis.products || []) {
    if (product.brand) tags.add(product.brand.toLowerCase());
    if (product.product) tags.add(product.product.toLowerCase());
    if (product.model) tags.add(product.model.toLowerCase());
    if (product.category) tags.add(product.category.toLowerCase());
    
    // Combined brand + product tags for precise search
    if (product.brand && product.product) {
      tags.add(`${product.brand} ${product.product}`.toLowerCase());
    }
    if (product.brand && product.product && product.model) {
      tags.add(`${product.brand} ${product.product} ${product.model}`.toLowerCase());
    }
    if (product.brand && product.product && product.color) {
      tags.add(`${product.brand} ${product.product} ${product.color}`.toLowerCase());
    }
  }

  // Add objects with brands
  for (const obj of analysis.objects || []) {
    tags.add(obj.name?.toLowerCase());
    if (obj.brand) tags.add(obj.brand.toLowerCase());
    if (obj.model) tags.add(obj.model.toLowerCase());
    
    // Combined tags
    if (obj.brand && obj.name) {
      tags.add(`${obj.brand} ${obj.name}`.toLowerCase());
    }
  }

  // Add subjects
  for (const subject of analysis.subjects || []) {
    tags.add(subject.type?.toLowerCase());
    for (const attr of subject.attributes || []) {
      tags.add(attr.toLowerCase());
    }
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

  // Add text/logos (brand visibility)
  for (const text of analysis.text || []) {
    if (text.type === 'brand' || text.type === 'logo') {
      tags.add(text.content?.toLowerCase());
    }
  }

  // Clean up and return
  return Array.from(tags)
    .filter(tag => tag && tag.length > 1 && tag.length < 50)
    .slice(0, 80);
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

  // Products with brands (CRITICAL for precise search like "Apple AirPods Max")
  for (const product of analysis.products || []) {
    const productDesc = [
      product.brand,
      product.product,
      product.model,
      product.color,
      product.category
    ].filter(Boolean).join(" ");
    if (productDesc) parts.push(productDesc);
  }

  // Objects with brands
  for (const obj of analysis.objects || []) {
    const objDesc = [
      obj.brand,
      obj.model,
      obj.name,
      obj.description
    ].filter(Boolean).join(" ");
    if (objDesc) parts.push(objDesc);
  }

  // Clothing details with brands
  for (const clothing of analysis.clothing || []) {
    const clothingDesc = [
      clothing.brand,
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

  // Text/logos visible
  for (const text of analysis.text || []) {
    if (text.content) parts.push(text.content);
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

  // Select models (Gemini only)
  const models = selectModel(imageSize, mimeType, quality);

  let result: AnalysisResult | null = null;

  // Use Gemini for analysis
  result = await analyzeWithGemini(base64Image, mimeType, models.gemini);

  if (!result) {
    throw new Error("Gemini analysis failed");
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
