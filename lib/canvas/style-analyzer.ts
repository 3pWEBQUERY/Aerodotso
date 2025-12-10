// Style Analyzer for Spatial AI Canvas
// Analyzes image styles and enables style transfer between nodes

import { StyleAnalysis, ImageNodeData } from "./types";

// ============================================================================
// STYLE ANALYSIS WITH AI
// ============================================================================

export async function analyzeImageStyle(imageUrl: string): Promise<StyleAnalysis> {
  try {
    const response = await fetch("/api/analyze-style", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image style");
    }

    return await response.json();
  } catch (error) {
    console.error("Style analysis error:", error);
    // Return default analysis on error
    return getDefaultStyleAnalysis();
  }
}

// ============================================================================
// STYLE EXTRACTION FROM IMAGE DATA
// ============================================================================

export function extractStyleFromImageData(imageData: ImageNodeData): Partial<StyleAnalysis> {
  const style: Partial<StyleAnalysis> = {
    styleKeywords: [],
    colorPalette: [],
    techniques: [],
  };

  if (imageData.aiAnalysis) {
    const analysis = imageData.aiAnalysis;
    
    if (analysis.style) {
      style.styleKeywords = analysis.style;
    }
    if (analysis.colors) {
      style.colorPalette = analysis.colors;
    }
    if (analysis.composition) {
      style.composition = analysis.composition;
    }
    if (analysis.mood) {
      style.mood = analysis.mood;
    }
  }

  if (imageData.aiTags) {
    style.styleKeywords = [...(style.styleKeywords || []), ...imageData.aiTags];
  }

  return style;
}

// ============================================================================
// STYLE TRANSFER PROMPT BUILDER
// ============================================================================

export function buildStyleTransferPrompt(
  targetDescription: string,
  sourceStyle: Partial<StyleAnalysis>
): string {
  const parts: string[] = [targetDescription];

  if (sourceStyle.composition) {
    parts.push(`with ${sourceStyle.composition} composition`);
  }

  if (sourceStyle.mood) {
    parts.push(`conveying a ${sourceStyle.mood} mood`);
  }

  if (sourceStyle.styleKeywords && sourceStyle.styleKeywords.length > 0) {
    const styleStr = sourceStyle.styleKeywords.slice(0, 5).join(", ");
    parts.push(`in ${styleStr} style`);
  }

  if (sourceStyle.colorPalette && sourceStyle.colorPalette.length > 0) {
    const colorStr = sourceStyle.colorPalette.slice(0, 4).join(", ");
    parts.push(`using colors: ${colorStr}`);
  }

  if (sourceStyle.techniques && sourceStyle.techniques.length > 0) {
    const techStr = sourceStyle.techniques.slice(0, 3).join(", ");
    parts.push(`employing ${techStr} techniques`);
  }

  if (sourceStyle.lighting) {
    parts.push(`with ${sourceStyle.lighting} lighting`);
  }

  return parts.join(", ");
}

// ============================================================================
// STYLE COMPARISON
// ============================================================================

export function compareStyles(
  style1: Partial<StyleAnalysis>,
  style2: Partial<StyleAnalysis>
): number {
  let score = 0;
  let comparisons = 0;

  // Compare color palettes
  if (style1.colorPalette && style2.colorPalette) {
    const commonColors = style1.colorPalette.filter(c => 
      style2.colorPalette?.includes(c)
    );
    score += commonColors.length / Math.max(style1.colorPalette.length, style2.colorPalette.length);
    comparisons++;
  }

  // Compare style keywords
  if (style1.styleKeywords && style2.styleKeywords) {
    const commonKeywords = style1.styleKeywords.filter(k => 
      style2.styleKeywords?.some(k2 => k.toLowerCase() === k2.toLowerCase())
    );
    score += commonKeywords.length / Math.max(style1.styleKeywords.length, style2.styleKeywords.length);
    comparisons++;
  }

  // Compare mood
  if (style1.mood && style2.mood) {
    score += style1.mood.toLowerCase() === style2.mood.toLowerCase() ? 1 : 0;
    comparisons++;
  }

  return comparisons > 0 ? score / comparisons : 0;
}

// ============================================================================
// STYLE KEYWORDS EXTRACTION
// ============================================================================

export function extractStyleKeywords(text: string): string[] {
  const styleWords = [
    // Art styles
    "minimalist", "modern", "vintage", "retro", "futuristic", "abstract",
    "realistic", "surreal", "impressionist", "expressionist", "pop art",
    "art deco", "art nouveau", "baroque", "renaissance", "contemporary",
    
    // Visual qualities
    "vibrant", "muted", "pastel", "bold", "subtle", "dramatic",
    "soft", "harsh", "warm", "cool", "neutral", "monochrome",
    "colorful", "grayscale", "high contrast", "low contrast",
    
    // Composition
    "symmetric", "asymmetric", "centered", "rule of thirds",
    "minimalist", "complex", "layered", "flat", "3d", "isometric",
    
    // Lighting
    "natural light", "studio", "golden hour", "blue hour",
    "backlit", "side lit", "dramatic lighting", "soft lighting",
    
    // Mood
    "peaceful", "energetic", "mysterious", "playful", "elegant",
    "rustic", "industrial", "organic", "geometric", "chaotic",
  ];

  const lowerText = text.toLowerCase();
  return styleWords.filter(word => lowerText.includes(word));
}

// ============================================================================
// COLOR PALETTE EXTRACTION
// ============================================================================

export function suggestComplementaryColors(baseColor: string): string[] {
  // Simple complementary color calculation
  // In production, use a proper color library
  const colorMap: Record<string, string[]> = {
    red: ["#FF0000", "#00FFFF", "#FFD700", "#FF6B6B"],
    blue: ["#0000FF", "#FFA500", "#4169E1", "#87CEEB"],
    green: ["#00FF00", "#FF00FF", "#32CD32", "#90EE90"],
    yellow: ["#FFFF00", "#9400D3", "#FFD700", "#F0E68C"],
    purple: ["#800080", "#FFD700", "#9370DB", "#DDA0DD"],
    orange: ["#FFA500", "#0000FF", "#FF8C00", "#FFDAB9"],
    pink: ["#FFC0CB", "#90EE90", "#FF69B4", "#FFB6C1"],
  };

  const lowerColor = baseColor.toLowerCase();
  return colorMap[lowerColor] || ["#333333", "#666666", "#999999", "#CCCCCC"];
}

// ============================================================================
// DEFAULT STYLE ANALYSIS
// ============================================================================

function getDefaultStyleAnalysis(): StyleAnalysis {
  return {
    composition: "balanced",
    colorPalette: [],
    lighting: "natural",
    mood: "neutral",
    techniques: [],
    styleKeywords: [],
    detailedDescription: "Unable to analyze style",
  };
}

// ============================================================================
// STYLE PRESETS
// ============================================================================

export const STYLE_PRESETS: Record<string, Partial<StyleAnalysis>> = {
  cinematic: {
    composition: "wide aspect ratio with dramatic framing",
    lighting: "dramatic cinematic lighting with strong shadows",
    mood: "epic and atmospheric",
    styleKeywords: ["cinematic", "dramatic", "film", "movie-like"],
    techniques: ["shallow depth of field", "color grading", "anamorphic"],
  },
  minimal: {
    composition: "clean and simple with lots of negative space",
    lighting: "soft and even",
    mood: "calm and serene",
    styleKeywords: ["minimalist", "clean", "simple", "modern"],
    techniques: ["flat design", "geometric shapes", "limited palette"],
  },
  vintage: {
    composition: "classic and nostalgic framing",
    lighting: "warm with slight grain",
    mood: "nostalgic and warm",
    styleKeywords: ["vintage", "retro", "old-school", "classic"],
    techniques: ["film grain", "faded colors", "vignette"],
  },
  futuristic: {
    composition: "dynamic with tech elements",
    lighting: "neon and high-tech",
    mood: "cutting-edge and innovative",
    styleKeywords: ["futuristic", "sci-fi", "cyberpunk", "tech"],
    techniques: ["holographic", "glowing elements", "chrome"],
  },
  watercolor: {
    composition: "flowing and organic",
    lighting: "soft and diffused",
    mood: "dreamy and artistic",
    styleKeywords: ["watercolor", "artistic", "painted", "soft"],
    techniques: ["wet-on-wet", "color bleeding", "paper texture"],
  },
  photography: {
    composition: "professional photography framing",
    lighting: "studio or natural light",
    mood: "professional and polished",
    styleKeywords: ["photorealistic", "professional", "sharp", "detailed"],
    techniques: ["high resolution", "sharp focus", "proper exposure"],
  },
};

export function getStylePreset(presetName: string): Partial<StyleAnalysis> | undefined {
  return STYLE_PRESETS[presetName];
}

export function getAllStylePresets(): Array<{ name: string; style: Partial<StyleAnalysis> }> {
  return Object.entries(STYLE_PRESETS).map(([name, style]) => ({ name, style }));
}
