// Canvas Node Components Index
// All custom node types for the Spatial AI Canvas

export { default as ImageNode } from "./image-node";
export { default as VideoNode } from "./video-node";
export { default as DocumentNode } from "./document-node";
export { default as NoteNode } from "./note-node";
export { default as UrlNode } from "./url-node";
export { default as AIChatNode } from "./ai-chat-node";
export { default as AIGeneratorNode } from "./ai-generator-node";
export { default as GroupNode } from "./group-node";

// Node types mapping for React Flow
import ImageNode from "./image-node";
import VideoNode from "./video-node";
import DocumentNode from "./document-node";
import NoteNode from "./note-node";
import UrlNode from "./url-node";
import AIChatNode from "./ai-chat-node";
import AIGeneratorNode from "./ai-generator-node";
import GroupNode from "./group-node";

export const nodeTypes = {
  image: ImageNode,
  video: VideoNode,
  document: DocumentNode,
  note: NoteNode,
  url: UrlNode,
  "ai-chat": AIChatNode,
  "ai-generator": AIGeneratorNode,
  group: GroupNode,
};
