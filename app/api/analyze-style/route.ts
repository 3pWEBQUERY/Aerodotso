import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface StyleAnalysisResult {
  composition: string;
  colorPalette: string[];
  lighting: string;
  mood: string;
  techniques: string[];
  styleKeywords: string[];
  detailedDescription: string;
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Fetch image and convert to base64
    let imageBase64: string;
    let mimeType: string;

    if (imageUrl.startsWith("data:")) {
      // Already base64
      const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          { error: "Invalid base64 image format" },
          { status: 400 }
        );
      }
      mimeType = matches[1];
      imageBase64 = matches[2];
    } else {
      // Fetch from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch image" },
          { status: 400 }
        );
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      mimeType = imageResponse.headers.get("content-type") || "image/png";
    }

    // Analyze with Gemini Vision
    const prompt = `Analyze this image's visual style in detail for AI image generation purposes.

Return a JSON object with these exact fields:
{
  "composition": "describe the overall composition, framing, and layout",
  "colorPalette": ["list", "of", "dominant", "colors", "as", "names"],
  "lighting": "describe the lighting setup and quality",
  "mood": "overall emotional tone in 2-3 words",
  "techniques": ["list", "of", "artistic", "techniques", "used"],
  "styleKeywords": ["descriptive", "keywords", "for", "ai", "generation"],
  "detailedDescription": "comprehensive style description for replication"
}

Focus on aspects that would help recreate similar images with AI generation.
Return ONLY valid JSON, no markdown or explanation.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    
    // Parse JSON from response
    let styleAnalysis: StyleAnalysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        styleAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse style analysis:", parseError);
      // Return a default analysis
      styleAnalysis = {
        composition: "Unable to analyze composition",
        colorPalette: [],
        lighting: "Unknown",
        mood: "neutral",
        techniques: [],
        styleKeywords: [],
        detailedDescription: responseText.slice(0, 500),
      };
    }

    return NextResponse.json(styleAnalysis);
  } catch (error) {
    console.error("Style analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image style", details: String(error) },
      { status: 500 }
    );
  }
}
