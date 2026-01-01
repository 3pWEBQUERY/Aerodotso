import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";

// Action prompts for different AI operations
const ACTION_PROMPTS: Record<string, string> = {
  improve: `Improve the following text. Make it clearer, more engaging, and better written while maintaining the original meaning and tone. Only output the improved text, nothing else.`,
  
  fix: `Fix all spelling, grammar, and punctuation errors in the following text. Keep the original style and meaning. Only output the corrected text, nothing else.`,
  
  simplify: `Simplify the following text. Make it easier to understand by using simpler words and shorter sentences while keeping the key information. Only output the simplified text, nothing else.`,
  
  translate: `Translate the following text to English. Only output the translated text, nothing else.`,
};

export async function POST(request: NextRequest) {
  try {
    const { text, action, customPrompt } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Build the prompt
    let systemPrompt: string;
    
    if (action === "custom" && customPrompt) {
      systemPrompt = `${customPrompt}. Only output the result, no explanations or additional text.`;
    } else if (action && ACTION_PROMPTS[action]) {
      systemPrompt = ACTION_PROMPTS[action];
    } else {
      systemPrompt = `Process the following text according to user instructions. Only output the result, nothing else.`;
    }

    // Call Gemini 3 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nText:\n${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "AI processing failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
