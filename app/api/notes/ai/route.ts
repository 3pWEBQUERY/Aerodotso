import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

    if (!ANTHROPIC_API_KEY) {
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

    // Call Claude Sonnet 4.5
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `${systemPrompt}\n\nText:\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json(
        { error: "AI processing failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || "";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
