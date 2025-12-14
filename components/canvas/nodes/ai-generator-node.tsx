"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AIGeneratorNodeData, AIImageProvider, GenerationParameters, GeneratedImage } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  Wand2, 
  Trash2, 
  Copy, 
  Image as ImageIcon,
  ChevronDown,
  Loader2,
  Download,
  Plus,
  Grid3X3,
  RefreshCw,
  Settings,
  Link2,
  Save
} from "lucide-react";

const AI_PROVIDERS: { id: AIImageProvider; name: string; icon: string }[] = [
  { id: "dalle-3", name: "DALL-E 3", icon: "🎨" },
  { id: "midjourney", name: "Midjourney", icon: "🌈" },
  { id: "stable-diffusion-xl", name: "Stable Diffusion XL", icon: "🔷" },
  { id: "flux-pro", name: "Flux Pro", icon: "⚡" },
];

const ASPECT_RATIOS: { value: GenerationParameters['aspectRatio']; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "3:2", label: "3:2" },
];

function AIGeneratorNode({ id, data, selected }: NodeProps<AIGeneratorNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [prompt, setPrompt] = useState(data.prompt || "");
  const [aspectRatio, setAspectRatio] = useState<GenerationParameters['aspectRatio']>(
    data.parameters?.aspectRatio || "1:1"
  );
  
  const { 
    deleteNode, 
    duplicateNode, 
    updateNode, 
    addNode, 
    addEdge,
    getConnectedNodes,
    buildAIContext 
  } = useCanvasStore();

  const currentProvider = AI_PROVIDERS.find(p => p.id === data.provider) || AI_PROVIDERS[0];
  const connectedNodes = getConnectedNodes(id);
  const isGenerating = data.status === "generating";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleProviderChange = (provider: AIImageProvider) => {
    updateNode(id, { provider });
    setShowProviderDropdown(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    updateNode(id, { 
      status: "generating",
      prompt: prompt.trim(),
      parameters: { ...data.parameters, aspectRatio }
    });

    try {
      // Build context from connected reference images
      const connectedIds = connectedNodes.map(n => n.id);
      const context = buildAIContext(connectedIds);

      // Calculate dimensions based on aspect ratio
      const dimensions = getAspectRatioDimensions(aspectRatio);

      // Map provider to model name
      const modelMap: Record<AIImageProvider, string> = {
        'dalle-3': 'flux-2-pro',
        'midjourney': 'flux-2-pro',
        'stable-diffusion-xl': 'flux-2-pro',
        'flux-pro': 'flux-2-pro',
        'flux-dev': 'flux-2-pro',
        'imagen': 'nano-banana-pro',
      };

      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: modelMap[data.provider] || 'flux-2-pro',
          width: dimensions.width,
          height: dimensions.height,
          connectedImageUrls: context.images.map(i => i.url),
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const generatedImage: GeneratedImage = {
        id: `gen-${Date.now()}`,
        url: result.imageUrl,
        thumbnail: result.imageUrl,
        prompt: prompt.trim(),
        revisedPrompt: result.revisedPrompt,
        provider: data.provider,
        parameters: { aspectRatio, quality: "standard" },
        timestamp: new Date(),
        width: dimensions.width,
        height: dimensions.height,
        inCanvas: false,
        savedToLibrary: false,
      };

      updateNode(id, {
        status: "completed",
        generationHistory: [...(data.generationHistory || []), generatedImage],
      });
    } catch (error) {
      console.error("Generation error:", error);
      updateNode(id, {
        status: "error",
        error: error instanceof Error ? error.message : "Generation failed",
      });
    }
  };

  // Helper to get dimensions from aspect ratio
  const getAspectRatioDimensions = (ratio: GenerationParameters['aspectRatio']) => {
    const dimensionMap: Record<GenerationParameters['aspectRatio'], { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '4:3': { width: 1152, height: 896 },
      '9:16': { width: 768, height: 1344 },
      '3:2': { width: 1216, height: 832 },
      '2:3': { width: 832, height: 1216 },
    };
    return dimensionMap[ratio] || dimensionMap['1:1'];
  };

  const handleGenerateVariations = async () => {
    // Generate 4 variations
    for (let i = 0; i < 4; i++) {
      await handleGenerate();
    }
  };

  const addToCanvas = (image: GeneratedImage, index: number) => {
    // Create a new image node from generated image
    const newNode = {
      id: `image-${Date.now()}-${index}`,
      type: "image",
      position: {
        x: 100, // Will be positioned relative to generator
        y: 100 + index * 220,
      },
      data: {
        type: "image" as const,
        label: `Generated: ${image.prompt.slice(0, 30)}...`,
        url: image.url,
        thumbnail: image.thumbnail,
        width: image.width,
        height: image.height,
        fileSize: 0,
        mimeType: "image/png",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        tags: ["ai-generated"],
        aiTags: image.revisedPrompt?.split(" ").slice(0, 5) || [],
      },
    };

    addNode(newNode as any);

    // Create connection from generator to new image
    addEdge({
      id: `edge-${id}-${newNode.id}`,
      source: id,
      target: newNode.id,
      type: "smoothstep",
      animated: true,
      data: {
        connectionType: "ai-output",
        color: "#10B981",
        style: "dashed",
      },
    });

    // Mark as added to canvas
    const updatedHistory = data.generationHistory.map((img, i) =>
      img.id === image.id ? { ...img, inCanvas: true } : img
    );
    updateNode(id, { generationHistory: updatedHistory });
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-lg overflow-hidden
        transition-all duration-200
        ${selected ? "ring-2 ring-emerald-500 border-emerald-500" : "border-gray-200"}
      `}
      style={{ width: 340, minHeight: 380 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowProviderDropdown(false);
      }}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: 30 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
        style={{ top: 30 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Wand2 className="h-4 w-4 text-emerald-600" />
          </div>
          
          {/* Provider Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowProviderDropdown(!showProviderDropdown);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white/50 rounded-md transition-colors"
            >
              <span>{currentProvider.icon}</span>
              <span>{currentProvider.name}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showProviderDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border z-50">
                {AI_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProviderChange(provider.id);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      provider.id === data.provider ? "bg-emerald-50 text-emerald-700" : "text-gray-700"
                    }`}
                  >
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {connectedNodes.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-xl mr-1">
              <Link2 className="h-2.5 w-2.5" />
              <span>{connectedNodes.length} refs</span>
            </div>
          )}
          
          {isHovered && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Prompt Input */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image..."
            className="w-full h-20 p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            disabled={isGenerating}
          />
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">
            Aspect Ratio
          </label>
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                type="button"
                onClick={() => setAspectRatio(ratio.value)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  aspectRatio === ratio.value
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleGenerateVariations}
            disabled={!prompt.trim() || isGenerating}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            title="Generate 4 variations"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>

        {/* Error Message */}
        {data.status === "error" && data.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {data.error}
          </div>
        )}

        {/* Generation History */}
        {data.generationHistory && data.generationHistory.length > 0 && (
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">
              History ({data.generationHistory.length})
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {data.generationHistory.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group"
                >
                  <img
                    src={image.thumbnail || image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {!image.inCanvas && (
                      <button
                        type="button"
                        onClick={() => addToCanvas(image, index)}
                        className="p-1 bg-white rounded hover:bg-gray-100"
                        title="Add to canvas"
                      >
                        <Plus className="h-3 w-3 text-gray-700" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1 bg-white rounded hover:bg-gray-100"
                      title="Save to library"
                    >
                      <Save className="h-3 w-3 text-gray-700" />
                    </button>
                  </div>

                  {/* Added indicator */}
                  {image.inCanvas && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <ImageIcon className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AIGeneratorNode);
