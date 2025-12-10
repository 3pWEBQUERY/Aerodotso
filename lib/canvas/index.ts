// Canvas Library Exports
// Central export point for all canvas-related functionality

// Types
export * from "./types";

// Store
export { useCanvasStore } from "./store";
export {
  useCanvasNodes,
  useCanvasEdges,
  useCanvasViewport,
  useSelectedNodeIds,
  useCanvasMetadata,
  useCollaborators,
  useCanvasLoading,
  useCanvasSaving,
} from "./store";

// Layout Engine
export {
  applySmartLayout,
  suggestBestLayout,
  layoutAroundNode,
  layoutGeneratedImages,
} from "./layout-engine";

// Context Builder
export {
  AIContextBuilder,
  enhancePromptWithContext,
  buildStyleTransferPrompt,
  summarizeContext,
  generateVariationPrompts,
} from "./context-builder";

// Templates
export {
  CANVAS_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  getAllTemplates,
  instantiateTemplate,
  TEMPLATE_CATEGORIES,
} from "./templates";

// Style Analyzer
export {
  analyzeImageStyle,
  extractStyleFromImageData,
  buildStyleTransferPrompt as buildStylePrompt,
  compareStyles,
  extractStyleKeywords,
  suggestComplementaryColors,
  STYLE_PRESETS,
  getStylePreset,
  getAllStylePresets,
} from "./style-analyzer";

// Export/Import
export {
  exportCanvasToJSON,
  downloadCanvasAsJSON,
  exportCanvasAsImage,
  parseCanvasJSON,
  importCanvasFromFile,
  mergeCanvases,
  copyNodesToClipboard,
  pasteNodesFromClipboard,
  validateCanvasData,
} from "./export-import";
