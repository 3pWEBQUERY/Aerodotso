import { NextRequest, NextResponse } from "next/server";

// API Configuration - Keys from environment variables
const FLUX_API_KEY = process.env.FLUX_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API URLs
const FLUX_API_URL = "https://api.bfl.ml/v1";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GenerateRequest {
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  connectedImageUrls?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, model, width = 1024, height = 1024, connectedImageUrls } = body;

    console.log("=== Image Generation Request ===");
    console.log("Prompt:", prompt);
    console.log("Model:", model);
    console.log("Connected Images:", connectedImageUrls);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const hasReferenceImages = !!(connectedImageUrls && connectedImageUrls.length > 0);

    // Route to different APIs based on model
    if (model === "nano-banana-pro") {
      // Use Google Gemini/Imagen API
      console.log("=== GEMINI/IMAGEN API ===");
      return await generateWithGemini(prompt, width, height, connectedImageUrls, hasReferenceImages);
    } else {
      // Use BFL Flux API (default)
      console.log("=== BFL FLUX API ===");
      return await generateWithFlux(prompt, width, height, connectedImageUrls, hasReferenceImages, model);
    }

  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================
// Google Gemini Native Image Generation API
// Uses gemini-2.5-flash-image (Nano Banana) for native image generation/editing
// ============================================
async function generateWithGemini(
  prompt: string,
  width: number,
  height: number,
  connectedImageUrls: string[] | undefined,
  hasReferenceImages: boolean
) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in environment variables" },
      { status: 500 }
    );
  }

  // Use Gemini 2.5 Flash Image (Nano Banana) for native image generation
  const endpoint = `${GEMINI_API_URL}/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
  
  // Build the request parts
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  
  // Add the text prompt
  parts.push({ text: prompt });
  
  // If we have reference images, add them for image editing
  if (hasReferenceImages && connectedImageUrls) {
    console.log("Image editing mode - adding reference image");
    
    try {
      const imageResponse = await fetch(connectedImageUrls[0]);
      if (!imageResponse.ok) {
        throw new Error("Failed to download reference image");
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const contentType = imageResponse.headers.get("content-type") || "image/png";
      
      // Add the image to parts
      parts.push({
        inlineData: {
          mimeType: contentType,
          data: base64Image
        }
      });
      
      console.log("Reference image added, size:", base64Image.length, "chars");
    } catch (error) {
      console.error("Error loading reference image:", error);
    }
  }

  // Calculate aspect ratio
  const aspectRatio = width === height ? "1:1" : (width > height ? "16:9" : "9:16");
  
  const requestBody = {
    contents: [
      {
        parts: parts
      }
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    }
  };
  
  console.log("Aspect ratio:", aspectRatio);
  
  console.log("Gemini Native Image Request - Parts count:", parts.length);
  console.log("Prompt:", prompt);
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  
  console.log("Gemini Response Status:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    return NextResponse.json(
      { error: "Failed to generate image with Gemini", details: errorText },
      { status: response.status }
    );
  }
  
  const data = await response.json();
  console.log("Gemini Response:", JSON.stringify(data, null, 2).substring(0, 500));
  
  // Extract image from Gemini Native Image response
  // Format: candidates[0].content.parts[] - can contain text and/or inlineData
  const candidates = data.candidates;
  if (candidates && candidates.length > 0) {
    const parts = candidates[0].content?.parts;
    if (parts && parts.length > 0) {
      // Find the image part (inlineData)
      for (const part of parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          if (imageData) {
            const imageUrl = `data:${mimeType};base64,${imageData}`;
            console.log("Image generated successfully!");
            return NextResponse.json({
              success: true,
              imageUrl: imageUrl,
              model: "nano-banana-pro",
              prompt: prompt,
            });
          }
        }
        // Log any text response
        if (part.text) {
          console.log("Gemini text response:", part.text);
        }
      }
    }
  }
  
  // Check for blocked content
  if (data.promptFeedback?.blockReason) {
    return NextResponse.json(
      { error: `Content blocked: ${data.promptFeedback.blockReason}` },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { error: "No image generated from Gemini API", details: JSON.stringify(data) },
    { status: 500 }
  );
}

// ============================================
// BFL Flux API
// ============================================
async function generateWithFlux(
  prompt: string,
  width: number,
  height: number,
  connectedImageUrls: string[] | undefined,
  hasReferenceImages: boolean,
  model: string
) {
  if (!FLUX_API_KEY) {
    return NextResponse.json(
      { error: "FLUX_API_KEY is not configured in environment variables" },
      { status: 500 }
    );
  }

  const endpoint = "/flux-2-flex";
  let requestBody: Record<string, unknown>;
  
  if (hasReferenceImages && connectedImageUrls) {
    console.log("Image-to-image mode");
    console.log("Reference image URL:", connectedImageUrls[0]);
    
    requestBody = {
      prompt: prompt,
      input_image: connectedImageUrls[0],
    };
    
    // Add additional reference images
    for (let i = 1; i < Math.min(connectedImageUrls.length, 10); i++) {
      requestBody[`input_image_${i + 1}`] = connectedImageUrls[i];
    }
  } else {
    console.log("Text-to-image mode");
    requestBody = {
      prompt: prompt,
      width: width,
      height: height,
    };
  }
  
  console.log("Flux Request:", JSON.stringify(requestBody, null, 2));
  
  const fluxResponse = await fetch(`${FLUX_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": FLUX_API_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  console.log("Flux API Response Status:", fluxResponse.status);

  if (!fluxResponse.ok) {
    const errorText = await fluxResponse.text();
    console.error("Flux API error:", errorText);
    return NextResponse.json(
      { error: "Failed to generate image with Flux", details: errorText },
      { status: fluxResponse.status }
    );
  }

  const fluxData = await fluxResponse.json();
  console.log("Flux API initial response:", JSON.stringify(fluxData));

  // Flux API returns a task ID, we need to poll for the result
  if (fluxData.id) {
    const resultUrl = await pollForResult(fluxData.id);
    
    return NextResponse.json({
      success: true,
      imageUrl: resultUrl,
      model: model,
      prompt: prompt,
    });
  }

  // If direct result
  return NextResponse.json({
    success: true,
    imageUrl: fluxData.sample || fluxData.url || fluxData.result?.sample,
    model: model,
    prompt: prompt,
  });
}

// Poll for image generation result
async function pollForResult(taskId: string, maxAttempts = 120): Promise<string> {
  console.log(`Polling for result, task ID: ${taskId}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls

    try {
      const response = await fetch(`${FLUX_API_URL}/get_result?id=${taskId}`, {
        headers: {
          "X-Key": FLUX_API_KEY!,
        },
      });

      if (!response.ok) {
        console.log(`Poll attempt ${attempt + 1}: Response not ok (${response.status})`);
        continue;
      }

      const data = await response.json();
      console.log(`Poll attempt ${attempt + 1}:`, JSON.stringify(data));
      
      // Check for ready status
      if (data.status === "Ready") {
        const imageUrl = data.result?.sample || data.sample || data.output;
        if (imageUrl) {
          console.log("Image ready:", imageUrl);
          return imageUrl;
        }
      }
      
      // Check for error status
      if (data.status === "Error" || data.status === "Failed") {
        throw new Error(data.error || data.message || "Image generation failed");
      }
      
      // Still processing - continue polling
      if (data.status === "Pending" || data.status === "Processing" || data.status === "Queued") {
        continue;
      }
    } catch (error) {
      console.log(`Poll attempt ${attempt + 1}: Error - ${error}`);
      // Continue polling on network errors
    }
  }

  throw new Error("Image generation timed out after 4 minutes");
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    fluxConfigured: !!FLUX_API_KEY,
    geminiConfigured: !!GEMINI_API_KEY,
    models: ["flux-2-pro", "nano-banana-pro"],
  });
}
