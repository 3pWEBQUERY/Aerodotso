// AI Context Builder for Spatial Canvas
// Intelligently gathers context from connected nodes for AI operations

import {
  CanvasNode,
  CanvasConnection,
  AIContextData,
  ImageNodeData,
  VideoNodeData,
  DocumentNodeData,
  NoteNodeData,
  AIChatNodeData,
  AIGeneratorNodeData,
  StyleAnalysis,
} from "./types";

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

export class AIContextBuilder {
  private nodes: CanvasNode[];
  private edges: CanvasConnection[];

  constructor(nodes: CanvasNode[], edges: CanvasConnection[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  // Build context from specific nodes
  buildFromNodes(nodeIds: string[]): AIContextData {
    const selectedNodes = this.nodes.filter(n => nodeIds.includes(n.id));
    return this.extractContext(selectedNodes);
  }

  // Build context from connected nodes (for AI chat/generator)
  buildFromConnectedNodes(nodeId: string): AIContextData {
    const connectedIds = this.getConnectedNodeIds(nodeId);
    const connectedNodes = this.nodes.filter(n => connectedIds.includes(n.id));
    return this.extractContext(connectedNodes);
  }

  // Build context for entire canvas
  buildCanvasContext(): AIContextData {
    return this.extractContext(this.nodes);
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private extractContext(nodes: CanvasNode[]): AIContextData {
    const context: AIContextData = {
      images: [],
      documents: [],
      notes: [],
      previousGenerations: [],
      styleKeywords: [],
      topics: [],
      colorPalette: [],
    };

    nodes.forEach(node => {
      const data = node.data;

      switch (data.type) {
        case "image": {
          const imageData = data as ImageNodeData;
          context.images.push({
            nodeId: node.id,
            url: imageData.url,
            analysis: this.formatImageAnalysis(imageData),
          });

          // Extract style information
          if (imageData.aiAnalysis) {
            context.styleKeywords.push(...imageData.aiAnalysis.style);
            if (imageData.aiAnalysis.colors) {
              context.colorPalette!.push(...imageData.aiAnalysis.colors);
            }
            if (imageData.aiAnalysis.mood) {
              context.mood = imageData.aiAnalysis.mood;
            }
          }

          // Add tags as topics
          if (imageData.tags) {
            context.topics.push(...imageData.tags);
          }
          if (imageData.aiTags) {
            context.topics.push(...imageData.aiTags);
          }
          break;
        }

        case "video": {
          const videoData = data as VideoNodeData;
          if (videoData.transcription) {
            context.documents.push({
              nodeId: node.id,
              summary: `Video transcription: ${videoData.transcription.text.slice(0, 500)}...`,
              keyPoints: this.extractKeyPoints(videoData.transcription.text),
            });
          }
          if (videoData.tags) {
            context.topics.push(...videoData.tags);
          }
          break;
        }

        case "document": {
          const docData = data as DocumentNodeData;
          context.documents.push({
            nodeId: node.id,
            summary: docData.summary || docData.extractedText?.slice(0, 500) || "",
            keyPoints: docData.extractedText
              ? this.extractKeyPoints(docData.extractedText)
              : [],
          });
          if (docData.tags) {
            context.topics.push(...docData.tags);
          }
          break;
        }

        case "note": {
          const noteData = data as NoteNodeData;
          context.notes.push({
            nodeId: node.id,
            content: noteData.content,
          });
          if (noteData.tags) {
            context.topics.push(...noteData.tags);
          }
          break;
        }

        case "ai-generator": {
          const genData = data as AIGeneratorNodeData;
          if (genData.generationHistory) {
            context.previousGenerations.push(...genData.generationHistory);
          }
          break;
        }

        case "ai-chat": {
          const chatData = data as AIChatNodeData;
          // Extract key topics from conversation
          if (chatData.conversation && chatData.conversation.length > 0) {
            const lastMessages = chatData.conversation.slice(-5);
            lastMessages.forEach(msg => {
              if (msg.role === "assistant") {
                // Extract potential topics from AI responses
                const words = msg.content.split(/\s+/).filter(w => w.length > 5);
                context.topics.push(...words.slice(0, 5));
              }
            });
          }
          break;
        }
      }
    });

    // Deduplicate and clean up
    context.styleKeywords = [...new Set(context.styleKeywords)].slice(0, 20);
    context.topics = [...new Set(context.topics)].slice(0, 30);
    context.colorPalette = [...new Set(context.colorPalette)].slice(0, 10);

    return context;
  }

  private getConnectedNodeIds(nodeId: string): string[] {
    const connectedIds = new Set<string>();

    this.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedIds.add(edge.target);
      }
      if (edge.target === nodeId) {
        connectedIds.add(edge.source);
      }
    });

    return Array.from(connectedIds);
  }

  private formatImageAnalysis(imageData: ImageNodeData): string {
    if (!imageData.aiAnalysis) return "";

    const analysis = imageData.aiAnalysis;
    const parts: string[] = [];

    if (analysis.composition) {
      parts.push(`Composition: ${analysis.composition}`);
    }
    if (analysis.mood) {
      parts.push(`Mood: ${analysis.mood}`);
    }
    if (analysis.style && analysis.style.length > 0) {
      parts.push(`Style: ${analysis.style.join(", ")}`);
    }
    if (analysis.objects && analysis.objects.length > 0) {
      parts.push(`Contains: ${analysis.objects.join(", ")}`);
    }

    return parts.join(". ");
  }

  private extractKeyPoints(text: string): string[] {
    // Simple key point extraction (could be enhanced with NLP)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }
}

// ============================================================================
// PROMPT ENHANCEMENT
// ============================================================================

export function enhancePromptWithContext(
  userPrompt: string,
  context: AIContextData
): string {
  const parts: string[] = [userPrompt];

  // Add style keywords if available
  if (context.styleKeywords.length > 0) {
    parts.push(`\nStyle references: ${context.styleKeywords.slice(0, 10).join(", ")}`);
  }

  // Add mood if available
  if (context.mood) {
    parts.push(`\nMood: ${context.mood}`);
  }

  // Add color palette if available
  if (context.colorPalette && context.colorPalette.length > 0) {
    parts.push(`\nColor palette: ${context.colorPalette.slice(0, 5).join(", ")}`);
  }

  // Add image analyses summaries
  if (context.images.length > 0) {
    const imageContexts = context.images
      .filter(img => img.analysis)
      .slice(0, 3)
      .map(img => img.analysis);
    
    if (imageContexts.length > 0) {
      parts.push(`\nReference image characteristics: ${imageContexts.join("; ")}`);
    }
  }

  // Add relevant notes
  if (context.notes.length > 0) {
    const noteContents = context.notes
      .slice(0, 2)
      .map(note => note.content.slice(0, 100));
    
    if (noteContents.length > 0) {
      parts.push(`\nAdditional context from notes: ${noteContents.join("; ")}`);
    }
  }

  return parts.join("");
}

// ============================================================================
// STYLE TRANSFER HELPERS
// ============================================================================

export function buildStyleTransferPrompt(
  targetDescription: string,
  styleAnalysis: StyleAnalysis
): string {
  const styleComponents: string[] = [];

  if (styleAnalysis.composition) {
    styleComponents.push(`composition: ${styleAnalysis.composition}`);
  }
  if (styleAnalysis.lighting) {
    styleComponents.push(`lighting: ${styleAnalysis.lighting}`);
  }
  if (styleAnalysis.mood) {
    styleComponents.push(`mood: ${styleAnalysis.mood}`);
  }
  if (styleAnalysis.techniques.length > 0) {
    styleComponents.push(`techniques: ${styleAnalysis.techniques.join(", ")}`);
  }
  if (styleAnalysis.styleKeywords.length > 0) {
    styleComponents.push(`style: ${styleAnalysis.styleKeywords.join(", ")}`);
  }

  return `${targetDescription}

Apply the following visual style:
${styleComponents.join("\n")}

${styleAnalysis.detailedDescription}`;
}

// ============================================================================
// CONTEXT SUMMARIZATION
// ============================================================================

export function summarizeContext(context: AIContextData): string {
  const parts: string[] = [];

  if (context.images.length > 0) {
    parts.push(`${context.images.length} reference image(s)`);
  }
  if (context.documents.length > 0) {
    parts.push(`${context.documents.length} document(s)`);
  }
  if (context.notes.length > 0) {
    parts.push(`${context.notes.length} note(s)`);
  }
  if (context.previousGenerations.length > 0) {
    parts.push(`${context.previousGenerations.length} previous generation(s)`);
  }
  if (context.styleKeywords.length > 0) {
    parts.push(`${context.styleKeywords.length} style keywords`);
  }
  if (context.topics.length > 0) {
    parts.push(`${context.topics.length} topics`);
  }

  if (parts.length === 0) {
    return "No context available";
  }

  return `Context includes: ${parts.join(", ")}`;
}

// ============================================================================
// BATCH PROMPT GENERATION
// ============================================================================

export function generateVariationPrompts(
  basePrompt: string,
  count: number = 4,
  context?: AIContextData
): string[] {
  const variations: string[] = [basePrompt];

  const styleVariations = [
    "with dramatic lighting",
    "in a minimalist style",
    "with vibrant colors",
    "in a photorealistic style",
    "with soft, dreamy atmosphere",
    "in a cinematic composition",
    "with high contrast",
    "in an artistic, painterly style",
  ];

  // Use context style keywords if available
  const additionalStyles = context?.styleKeywords || [];

  for (let i = 1; i < count; i++) {
    const styleIndex = (i - 1) % styleVariations.length;
    let variation = `${basePrompt}, ${styleVariations[styleIndex]}`;

    // Add context-based variation
    if (additionalStyles.length > 0 && i > 2) {
      const contextStyle = additionalStyles[i % additionalStyles.length];
      variation = `${basePrompt}, ${contextStyle} style`;
    }

    variations.push(variation);
  }

  return variations;
}
