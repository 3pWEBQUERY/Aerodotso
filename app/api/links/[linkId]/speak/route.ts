import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ElevenLabs API Key
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_a2aff0d47e5c5c3340831a24a1cd404779f1a4e896a34ffa";

// Default voice ID - Sarah (German)
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah voice

// POST - Convert text to speech using ElevenLabs
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text, voiceId } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    // Limit text to 5000 characters to be safe (ElevenLabs max is 10000)
    const MAX_CHARS = 5000;
    let processedText = text;
    
    if (text.length > MAX_CHARS) {
      // Truncate at sentence boundary if possible
      const truncated = text.substring(0, MAX_CHARS);
      const lastSentence = truncated.lastIndexOf(". ");
      if (lastSentence > MAX_CHARS * 0.7) {
        processedText = truncated.substring(0, lastSentence + 1);
      } else {
        processedText = truncated + "...";
      }
      console.log(`Text truncated from ${text.length} to ${processedText.length} characters`);
    }

    // Use ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || DEFAULT_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: processedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      
      // Return more specific error message
      let errorMessage = "Failed to generate speech";
      if (response.status === 401) {
        errorMessage = "Invalid ElevenLabs API key";
      } else if (response.status === 422) {
        errorMessage = "Invalid request - text may be too long";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded - please wait";
      }
      
      return NextResponse.json({ error: errorMessage, details: errorText }, { status: response.status });
    }

    // Return audio as stream
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error("ElevenLabs TTS failed:", error);
    return NextResponse.json({ error: "Text-to-speech failed" }, { status: 500 });
  }
}

// GET - Get available voices
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
    }

    const data = await response.json();
    
    // Return simplified voice list
    const voices = data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      labels: voice.labels,
      preview_url: voice.preview_url,
    })) || [];

    return NextResponse.json({ voices });
    
  } catch (error) {
    console.error("Failed to fetch voices:", error);
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
  }
}
