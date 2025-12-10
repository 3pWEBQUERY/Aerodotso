// Canvas Templates
// Pre-built canvas layouts for different workflows

import { CanvasNode, CanvasConnection, CanvasTemplate } from "./types";

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export const CANVAS_TEMPLATES: Record<string, CanvasTemplate> = {
  // Study Partner Template
  study: {
    id: "study",
    name: "Study Partner",
    description: "AI-powered study assistant with notes, documents, and chat",
    category: "education",
    tags: ["study", "learning", "research", "notes"],
    useCases: ["Exam preparation", "Research projects", "Note-taking"],
    createdBy: "system",
    isPublic: true,
    usageCount: 0,
    nodes: [
      {
        id: "study-chat-1",
        type: "ai-chat",
        position: { x: 400, y: 100 },
        data: {
          type: "ai-chat",
          label: "Study Assistant",
          model: "claude-sonnet-4",
          conversation: [],
          connectedAssetIds: [],
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "study-note-1",
        type: "note",
        position: { x: 100, y: 100 },
        data: {
          type: "note",
          label: "Key Concepts",
          content: "# Key Concepts\n\nAdd your main study topics here...",
          backgroundColor: "yellow",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "study-note-2",
        type: "note",
        position: { x: 100, y: 320 },
        data: {
          type: "note",
          label: "Questions",
          content: "# Questions\n\n- What is...\n- How does...\n- Why...",
          backgroundColor: "blue",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "study-doc-1",
        type: "document",
        position: { x: 100, y: 540 },
        data: {
          type: "document",
          label: "Study Material",
          url: "",
          fileType: "pdf",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
    ],
    edges: [
      {
        id: "edge-note1-chat",
        source: "study-note-1",
        target: "study-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Context",
        },
      },
      {
        id: "edge-doc-chat",
        source: "study-doc-1",
        target: "study-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Reference",
        },
      },
    ],
    instructions: "1. Add your study materials\n2. Write key concepts in notes\n3. Ask the AI assistant questions",
  },

  // Marketing Playground Template
  marketing: {
    id: "marketing",
    name: "Marketing Playground",
    description: "Creative space for marketing campaigns with AI image generation",
    category: "marketing",
    tags: ["marketing", "creative", "ads", "social media"],
    useCases: ["Ad campaigns", "Social media content", "Brand visuals"],
    createdBy: "system",
    isPublic: true,
    usageCount: 0,
    nodes: [
      {
        id: "marketing-gen-1",
        type: "ai-generator",
        position: { x: 400, y: 100 },
        data: {
          type: "ai-generator",
          label: "Image Generator",
          provider: "flux-pro",
          prompt: "",
          referenceImageIds: [],
          parameters: { aspectRatio: "1:1", quality: "hd" },
          generationHistory: [],
          status: "idle",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "marketing-chat-1",
        type: "ai-chat",
        position: { x: 800, y: 100 },
        data: {
          type: "ai-chat",
          label: "Marketing Copywriter",
          model: "claude-sonnet-4",
          conversation: [],
          connectedAssetIds: [],
          systemPrompt: "You are an expert marketing copywriter. Help create compelling ad copy, taglines, and marketing messages.",
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "marketing-note-1",
        type: "note",
        position: { x: 100, y: 100 },
        data: {
          type: "note",
          label: "Campaign Brief",
          content: "# Campaign Brief\n\n**Product:**\n\n**Target Audience:**\n\n**Key Message:**\n\n**Tone:**",
          backgroundColor: "purple",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "marketing-note-2",
        type: "note",
        position: { x: 100, y: 320 },
        data: {
          type: "note",
          label: "Brand Guidelines",
          content: "# Brand Guidelines\n\n**Colors:**\n\n**Fonts:**\n\n**Voice:**",
          backgroundColor: "pink",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
    ],
    edges: [
      {
        id: "edge-brief-gen",
        source: "marketing-note-1",
        target: "marketing-gen-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Brief",
        },
      },
      {
        id: "edge-brief-chat",
        source: "marketing-note-1",
        target: "marketing-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Brief",
        },
      },
    ],
    instructions: "1. Fill in the campaign brief\n2. Generate visuals with the AI Generator\n3. Create copy with the Marketing Copywriter",
  },

  // YouTube Content System Template
  youtube: {
    id: "youtube",
    name: "YouTube Content System",
    description: "Plan and create YouTube content with AI assistance",
    category: "content",
    tags: ["youtube", "video", "content", "creator"],
    useCases: ["Video planning", "Thumbnail creation", "Script writing"],
    createdBy: "system",
    isPublic: true,
    usageCount: 0,
    nodes: [
      {
        id: "yt-chat-1",
        type: "ai-chat",
        position: { x: 500, y: 100 },
        data: {
          type: "ai-chat",
          label: "Script Writer",
          model: "claude-sonnet-4",
          conversation: [],
          connectedAssetIds: [],
          systemPrompt: "You are an expert YouTube scriptwriter. Help create engaging video scripts, hooks, and calls to action.",
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "yt-gen-1",
        type: "ai-generator",
        position: { x: 500, y: 550 },
        data: {
          type: "ai-generator",
          label: "Thumbnail Generator",
          provider: "flux-pro",
          prompt: "",
          referenceImageIds: [],
          parameters: { aspectRatio: "16:9", quality: "hd" },
          generationHistory: [],
          status: "idle",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "yt-note-1",
        type: "note",
        position: { x: 100, y: 100 },
        data: {
          type: "note",
          label: "Video Idea",
          content: "# Video Idea\n\n**Title:**\n\n**Hook:**\n\n**Main Points:**\n1.\n2.\n3.\n\n**CTA:**",
          backgroundColor: "orange",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "yt-note-2",
        type: "note",
        position: { x: 100, y: 380 },
        data: {
          type: "note",
          label: "Storyboard",
          content: "# Storyboard\n\n**Scene 1:** Hook (0:00-0:30)\n\n**Scene 2:** Problem (0:30-2:00)\n\n**Scene 3:** Solution (2:00-6:00)\n\n**Scene 4:** CTA (6:00-7:00)",
          backgroundColor: "green",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "yt-note-3",
        type: "note",
        position: { x: 100, y: 660 },
        data: {
          type: "note",
          label: "SEO Keywords",
          content: "# SEO Keywords\n\n**Primary:**\n\n**Secondary:**\n\n**Hashtags:**",
          backgroundColor: "blue",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
    ],
    edges: [
      {
        id: "edge-idea-script",
        source: "yt-note-1",
        target: "yt-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Idea",
        },
      },
      {
        id: "edge-story-script",
        source: "yt-note-2",
        target: "yt-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Structure",
        },
      },
      {
        id: "edge-idea-thumb",
        source: "yt-note-1",
        target: "yt-gen-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Concept",
        },
      },
    ],
    instructions: "1. Write your video idea and storyboard\n2. Generate the script with AI\n3. Create thumbnails with the generator",
  },

  // Research Project Template
  research: {
    id: "research",
    name: "Research Project",
    description: "Organize research with documents, notes, and AI analysis",
    category: "research",
    tags: ["research", "academic", "analysis", "documents"],
    useCases: ["Academic research", "Market research", "Competitive analysis"],
    createdBy: "system",
    isPublic: true,
    usageCount: 0,
    nodes: [
      {
        id: "research-chat-1",
        type: "ai-chat",
        position: { x: 600, y: 250 },
        data: {
          type: "ai-chat",
          label: "Research Assistant",
          model: "claude-sonnet-4",
          conversation: [],
          connectedAssetIds: [],
          systemPrompt: "You are a research assistant. Help analyze documents, synthesize information, and identify patterns.",
          isExpanded: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "research-note-1",
        type: "note",
        position: { x: 100, y: 100 },
        data: {
          type: "note",
          label: "Research Question",
          content: "# Research Question\n\nWhat is the relationship between...",
          backgroundColor: "purple",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "research-note-2",
        type: "note",
        position: { x: 100, y: 300 },
        data: {
          type: "note",
          label: "Key Findings",
          content: "# Key Findings\n\n1.\n2.\n3.",
          backgroundColor: "green",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "research-note-3",
        type: "note",
        position: { x: 100, y: 500 },
        data: {
          type: "note",
          label: "Sources",
          content: "# Sources\n\n- Source 1\n- Source 2\n- Source 3",
          backgroundColor: "blue",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
    ],
    edges: [
      {
        id: "edge-question-chat",
        source: "research-note-1",
        target: "research-chat-1",
        type: "ai-connection",
        data: {
          connectionType: "ai-input",
          label: "Question",
        },
      },
    ],
    instructions: "1. Define your research question\n2. Add source documents\n3. Use AI to analyze and synthesize",
  },

  // Mood Board Template
  moodboard: {
    id: "moodboard",
    name: "Mood Board",
    description: "Visual inspiration board with AI style analysis",
    category: "design",
    tags: ["design", "inspiration", "visual", "creative"],
    useCases: ["Brand design", "Interior design", "Fashion", "Art direction"],
    createdBy: "system",
    isPublic: true,
    usageCount: 0,
    nodes: [
      {
        id: "mood-gen-1",
        type: "ai-generator",
        position: { x: 600, y: 300 },
        data: {
          type: "ai-generator",
          label: "Style Generator",
          provider: "flux-pro",
          prompt: "",
          referenceImageIds: [],
          parameters: { aspectRatio: "1:1", quality: "hd" },
          generationHistory: [],
          status: "idle",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "mood-note-1",
        type: "note",
        position: { x: 100, y: 100 },
        data: {
          type: "note",
          label: "Color Palette",
          content: "# Color Palette\n\n🔵 Primary:\n🟢 Secondary:\n🟡 Accent:\n⚪ Neutral:",
          backgroundColor: "pink",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "mood-note-2",
        type: "note",
        position: { x: 100, y: 300 },
        data: {
          type: "note",
          label: "Style Keywords",
          content: "# Style Keywords\n\n- Minimal\n- Modern\n- Elegant\n- Bold",
          backgroundColor: "purple",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
      {
        id: "mood-note-3",
        type: "note",
        position: { x: 100, y: 500 },
        data: {
          type: "note",
          label: "Mood / Feeling",
          content: "# Mood / Feeling\n\nCalm, sophisticated, trustworthy",
          backgroundColor: "blue",
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "",
        },
      },
    ],
    edges: [
      {
        id: "edge-colors-gen",
        source: "mood-note-1",
        target: "mood-gen-1",
        type: "ai-connection",
        data: {
          connectionType: "style-source",
          label: "Colors",
        },
      },
      {
        id: "edge-style-gen",
        source: "mood-note-2",
        target: "mood-gen-1",
        type: "ai-connection",
        data: {
          connectionType: "style-source",
          label: "Style",
        },
      },
    ],
    instructions: "1. Define colors and style keywords\n2. Add reference images\n3. Generate new visuals matching the mood",
  },
};

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================

export function getTemplateById(id: string): CanvasTemplate | undefined {
  return CANVAS_TEMPLATES[id];
}

export function getTemplatesByCategory(category: string): CanvasTemplate[] {
  return Object.values(CANVAS_TEMPLATES).filter(t => t.category === category);
}

export function getAllTemplates(): CanvasTemplate[] {
  return Object.values(CANVAS_TEMPLATES);
}

export function instantiateTemplate(
  templateId: string,
  userId: string
): { nodes: CanvasNode[]; edges: CanvasConnection[] } | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  const now = new Date();
  const idSuffix = Date.now();

  // Create new nodes with unique IDs and updated timestamps
  const idMap = new Map<string, string>();
  
  const nodes: CanvasNode[] = template.nodes.map((node) => {
    const newId = `${node.id}-${idSuffix}`;
    idMap.set(node.id!, newId);
    
    return {
      ...node,
      id: newId,
      data: {
        ...node.data,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    } as CanvasNode;
  });

  // Update edge references to use new node IDs
  const edges: CanvasConnection[] = template.edges.map((edge) => ({
    ...edge,
    id: `${edge.id}-${idSuffix}`,
    source: idMap.get(edge.source!) || edge.source!,
    target: idMap.get(edge.target!) || edge.target!,
  })) as CanvasConnection[];

  return { nodes, edges };
}

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

export const TEMPLATE_CATEGORIES = [
  { id: "education", name: "Education", icon: "📚" },
  { id: "marketing", name: "Marketing", icon: "📣" },
  { id: "content", name: "Content Creation", icon: "🎬" },
  { id: "research", name: "Research", icon: "🔬" },
  { id: "design", name: "Design", icon: "🎨" },
];
