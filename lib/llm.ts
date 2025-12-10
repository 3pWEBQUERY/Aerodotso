// LLM Client for Miza - abstracted interface for AI interactions

export interface LLMCallOptions {
  prompt: string;
  context: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Call the LLM with a prompt and context from user documents
 * Uses Mistral API by default, can be switched to other providers
 */
export async function callLLM({
  prompt,
  context,
  maxTokens = 2048,
  temperature = 0.7,
}: LLMCallOptions): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  const body = {
    model: "mistral-large-latest",
    messages: [
      {
        role: "system",
        content:
          "Du bist ein hilfreicher Tutor und Coach. Antworte knapp, strukturiert und nutze nur den gelieferten Kontext. Falls der Kontext keine Antwort liefert, sage das ehrlich.",
      },
      {
        role: "user",
        content: `Kontext:\n${context}\n\n---\n\nFrage:\n${prompt}`,
      },
    ],
    max_tokens: maxTokens,
    temperature,
  };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LLM API Error:", errorText);
    throw new Error(`LLM error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  return json.choices[0].message.content as string;
}

/**
 * Call LLM with streaming response
 * Useful for real-time chat interfaces
 */
export async function* callLLMStream({
  prompt,
  context,
  maxTokens = 2048,
  temperature = 0.7,
}: LLMCallOptions): AsyncGenerator<string> {
  const apiKey = process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  const body = {
    model: "mistral-large-latest",
    messages: [
      {
        role: "system",
        content:
          "Du bist ein hilfreicher Tutor und Coach. Antworte knapp, strukturiert und nutze nur den gelieferten Kontext.",
      },
      {
        role: "user",
        content: `Kontext:\n${context}\n\n---\n\nFrage:\n${prompt}`,
      },
    ],
    max_tokens: maxTokens,
    temperature,
    stream: true,
  };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM stream error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}

/**
 * Generate a summary of a document
 */
export async function generateSummary(text: string): Promise<string> {
  return callLLM({
    prompt: "Erstelle eine kurze Zusammenfassung des folgenden Textes in 3-5 Sätzen:",
    context: text.slice(0, 8000), // Limit context length
    maxTokens: 500,
    temperature: 0.5,
  });
}

/**
 * Generate quiz questions from content
 */
export async function generateQuizQuestions(
  text: string,
  count: number = 5
): Promise<string> {
  return callLLM({
    prompt: `Erstelle ${count} Multiple-Choice Fragen basierend auf dem Kontext. Formatiere jede Frage mit 4 Antwortmöglichkeiten (A-D) und markiere die richtige Antwort.`,
    context: text.slice(0, 8000),
    maxTokens: 2000,
    temperature: 0.6,
  });
}
