// Document-related types for the Miza application

export interface DocumentChunk {
  id: number;
  content: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  type: "pdf" | "image" | "note" | "link";
  subject?: string;
  topic?: string;
  storage_path?: string;
  mime_type?: string;
  size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentText {
  document_id: string;
  full_text: string;
  tokens?: number;
}

export interface DocumentEmbedding {
  document_id: string;
  chunk_id: number;
  content: string;
  embedding: number[];
}

export interface ChatSession {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: "student" | "creator";
  display_name?: string;
  created_at: string;
}

export interface SearchResult {
  document_id: string;
  content: string;
  similarity: number;
}

export interface LLMResponse {
  answer: string;
  contextUsed?: SearchResult[];
}
