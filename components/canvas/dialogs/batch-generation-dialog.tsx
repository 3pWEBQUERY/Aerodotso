"use client";

import { useState } from "react";
import { X, Grid3X3, Loader2, CheckCircle2, AlertCircle, Wand2 } from "lucide-react";
import { AIImageProvider, GenerationParameters, GeneratedImage } from "@/lib/canvas/types";

interface BatchGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIImageProvider;
  aspectRatio: GenerationParameters["aspectRatio"];
  onComplete: (results: GeneratedImage[]) => void;
}

export function BatchGenerationDialog({
  isOpen,
  onClose,
  provider,
  aspectRatio,
  onComplete,
}: BatchGenerationDialogProps) {
  const [prompts, setPrompts] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const promptList = prompts
    .split("\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const getAspectRatioDimensions = (ratio: GenerationParameters["aspectRatio"]) => {
    const dimensionMap: Record<GenerationParameters["aspectRatio"], { width: number; height: number }> = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1344, height: 768 },
      "4:3": { width: 1152, height: 896 },
      "9:16": { width: 768, height: 1344 },
      "3:2": { width: 1216, height: 832 },
      "2:3": { width: 832, height: 1216 },
    };
    return dimensionMap[ratio] || dimensionMap["1:1"];
  };

  const handleGenerate = async () => {
    if (promptList.length === 0) return;

    setIsGenerating(true);
    setProgress(0);
    setResults([]);
    setErrors([]);

    const allResults: GeneratedImage[] = [];
    const allErrors: string[] = [];
    const dimensions = getAspectRatioDimensions(aspectRatio);

    for (let i = 0; i < promptList.length; i++) {
      const prompt = promptList[i];

      try {
        const response = await fetch("/api/image-generation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            model: provider === "imagen" ? "nano-banana-pro" : "flux-2-pro",
            width: dimensions.width,
            height: dimensions.height,
          }),
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        const generatedImage: GeneratedImage = {
          id: `batch-${Date.now()}-${i}`,
          url: result.imageUrl,
          thumbnail: result.imageUrl,
          prompt,
          provider,
          parameters: { aspectRatio, quality: "standard" },
          timestamp: new Date(),
          width: dimensions.width,
          height: dimensions.height,
          inCanvas: false,
          savedToLibrary: false,
        };

        allResults.push(generatedImage);
        setResults([...allResults]);
      } catch (error) {
        const errorMsg = `Failed: "${prompt.slice(0, 30)}..."`;
        allErrors.push(errorMsg);
        setErrors([...allErrors]);
      }

      setProgress(((i + 1) / promptList.length) * 100);
    }

    setIsGenerating(false);

    if (allResults.length > 0) {
      onComplete(allResults);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompts("");
      setResults([]);
      setErrors([]);
      setProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Grid3X3 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Batch Generation</h2>
              <p className="text-xs text-gray-500">Generate multiple images at once</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Instructions */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            Enter multiple prompts, one per line. Each will be generated as a separate image.
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Prompts
              </label>
              <span className="text-xs text-gray-500">
                {promptList.length} prompt{promptList.length !== 1 ? "s" : ""}
              </span>
            </div>
            <textarea
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              placeholder="A serene mountain landscape at sunset&#10;A futuristic city with flying cars&#10;An abstract painting in vibrant colors"
              rows={8}
              disabled={isGenerating}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-gray-50"
            />
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </div>
                <span className="text-gray-500">
                  {results.length}/{promptList.length}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-xl overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary */}
          {(results.length > 0 || errors.length > 0) && !isGenerating && (
            <div className="space-y-2">
              {results.length > 0 && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{results.length} images generated successfully</span>
                </div>
              )}
              {errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.length} prompts failed</span>
                  </div>
                  <div className="pl-6 space-y-0.5">
                    {errors.slice(0, 3).map((error, i) => (
                      <p key={i} className="text-xs text-red-500">
                        • {error}
                      </p>
                    ))}
                    {errors.length > 3 && (
                      <p className="text-xs text-red-400">
                        +{errors.length - 3} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
              {results.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={image.thumbnail || image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            {results.length > 0 ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={promptList.length === 0 || isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate {promptList.length} Image{promptList.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchGenerationDialog;
