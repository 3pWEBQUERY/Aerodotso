// Canvas Node Components Index
// All custom node types for the Spatial AI Canvas

export { default as ImageNode } from "./image-node";
export { default as VideoNode } from "./video-node";
export { default as DocumentNode } from "./document-node";
export { default as NoteNode } from "./note-node";
export { default as PostItNode } from "./postit-node";
export { default as UrlNode } from "./url-node";
export { default as AIChatNode } from "./ai-chat-node";
export { default as AIGeneratorNode } from "./ai-generator-node";
export { default as FolderNode } from "./group-node";
export { default as SocialPostNode } from "./social-post-node";
export { default as ShapeNode } from "./shape-node";

// Node types mapping for React Flow
import ImageNode from "./image-node";
import VideoNode from "./video-node";
import DocumentNode from "./document-node";
import NoteNode from "./note-node";
import PostItNode from "./postit-node";
import UrlNode from "./url-node";
import AIChatNode from "./ai-chat-node";
import AIGeneratorNode from "./ai-generator-node";
import FolderNode from "./group-node";
import SocialPostNode from "./social-post-node";
import ShapeNode from "./shape-node";

export const nodeTypes = {
  image: ImageNode,
  video: VideoNode,
  document: DocumentNode,
  note: NoteNode,
  postit: PostItNode,
  url: UrlNode,
  "ai-chat": AIChatNode,
  "ai-generator": AIGeneratorNode,
  folder: FolderNode,
  "social-post": SocialPostNode,
  shape: ShapeNode,
};
