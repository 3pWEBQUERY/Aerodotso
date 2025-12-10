// Embeddings service for semantic search in Miza

import type { DocumentChunk } from "./types";

const EMBEDDING_DIMENSION = 768; // Gemini embedding dimension

/**
 * Split text into chunks for embedding
 * Uses a simple character-based chunking with overlap
 */
export function chunkText(
  text: string,
  maxChars: number = 1000,
  overlap: number = 100
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let index = 0;
  let position = 0;

  while (position < text.length) {
    // Find a good break point (end of sentence or paragraph)
    let endPos = Math.min(position + maxChars, text.length);
    
    if (endPos < text.length) {
      // Try to break at sentence end
      const lastPeriod = text.lastIndexOf(".", endPos);
      const lastNewline = text.lastIndexOf("\n", endPos);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > position + maxChars * 0.5) {
        endPos = breakPoint + 1;
      }
    }

    const chunk = text.slice(position, endPos).trim();
    if (chunk.length > 0) {
      chunks.push({ id: index++, content: chunk });
    }

    // Move position with overlap
    position = endPos - overlap;
    if (position <= chunks[chunks.length - 1]?.content.length || 0) {
      position = endPos;
    }
  }

  return chunks;
}

/**
 * Generate embeddings for a single text query
 */
export async function embedQuery(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

/**
 * Generate embeddings for multiple chunks
 */
export async function embedChunks(chunks: DocumentChunk[]): Promise<number[][]> {
  const texts = chunks.map((c) => c.content);
  return generateEmbeddings(texts);
}

/**
 * Core embedding generation function
 * Uses Mistral embeddings API by default
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.LLM_API_KEY;
  
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured for embeddings");
  }

  // Using Mistral embed endpoint
  const response = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Embedding API Error:", errorText);
    throw new Error(`Embedding error: ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  return json.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Process a document: extract text, chunk it, and generate embeddings
 * Returns chunks with their embeddings ready to be stored
 */
export async function processDocumentForSearch(
  documentId: string,
  text: string
): Promise<{ chunks: DocumentChunk[]; embeddings: number[][] }> {
  // Clean and prepare text
  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Chunk the text
  const chunks = chunkText(cleanText);

  if (chunks.length === 0) {
    return { chunks: [], embeddings: [] };
  }

  // Generate embeddings for all chunks
  const embeddings = await embedChunks(chunks);

  return { chunks, embeddings };
}

/**
 * Format for pgvector storage
 */
export function formatEmbeddingForPgVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export { EMBEDDING_DIMENSION };
