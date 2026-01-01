"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ImageIcon, Loader2, Paperclip, Globe, ChevronDown } from "lucide-react";
import { ConnectionPoints } from "./connection-points";

// Available AI Image Generation Models
const AI_MODELS = [
  { id: "flux-2-pro", name: "Flux 2 Pro", logo: "/symbol-black.svg" },
  { id: "nano-banana-pro", name: "Nano Banana Pro", logo: "/gemini.png" },
] as const;

type AIModelId = typeof AI_MODELS[number]["id"];

interface ConnectedImage {
  id: string;
  title: string;
  previewUrl?: string;
}

interface AIImagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  connectedImages: ConnectedImage[];
  onImageGenerated?: (imageUrl: string, title: string) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export function AIImagePanelCard({
  isOpen,
  onClose,
  workspaceId,
  connectedImages,
  onImageGenerated,
}: AIImagePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("flux-2-pro");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedModelData = AI_MODELS.find(m => m.id === selectedModel);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputValue.trim();
    setInputValue("");
    setIsGenerating(true);

    try {
      // Get connected image URLs
      const imageUrls = connectedImages
        .filter(img => img.previewUrl)
        .map(img => img.previewUrl);
      
      console.log("=== Sending to Image Generation API ===");
      console.log("Prompt:", prompt);
      console.log("Model:", selectedModel);
      console.log("Connected Images:", imageUrls);
      
      // Call our Flux image generation API
      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          model: selectedModel,
          width: 1024,
          height: 1024,
          connectedImageUrls: imageUrls,
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        // Image generated successfully
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `✨ Image generated with ${selectedModelData?.name}!`,
          imageUrl: data.imageUrl,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (onImageGenerated) {
          onImageGenerated(data.imageUrl, `Generated: ${prompt.slice(0, 30)}...`);
        }
      } else {
        // Error or processing message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Generating your image... This may take a moment.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Failed to generate:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error generating your image. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="relative w-[400px] h-[500px] bg-white rounded-2xl shadow-lg border flex flex-col">
      {/* Connection points - always visible for AI Panel */}
      <ConnectionPoints
        isSelected={true}
        spacing={12}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-primary-light)]" />
          <span className="font-medium text-sm">Create with AI</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Connected Images Preview */}
      {connectedImages.length > 0 && (
        <div className="px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="h-3.5 w-3.5 text-[var(--accent-primary-light)]" />
            <span className="text-xs font-medium text-gray-600">
              {connectedImages.length} Bild{connectedImages.length > 1 ? "er" : ""} verbunden
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {connectedImages.map((img) => (
              <div 
                key={img.id} 
                className="relative flex-shrink-0 group"
              >
                <img
                  src={img.previewUrl}
                  alt={img.title}
                  className="h-16 w-16 object-cover rounded-lg border-2 border-[var(--accent-primary)]/30 shadow-sm"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white text-[10px] px-1 text-center truncate max-w-[60px]">
                    {img.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Start a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              {connectedImages.length > 0 
                ? "Beschreibe, wie das neue Bild aussehen soll"
                : "Ask questions, brainstorm ideas, or get help with your work"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === "user"
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Generated"
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="bg-gray-50 rounded-2xl border">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none min-h-[44px] max-h-[100px]"
            rows={1}
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Model Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                >
                  <img src={selectedModelData?.logo} alt="" className="h-4 w-4 object-contain" />
                  <span className="font-medium">{selectedModelData?.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                
                {/* Dropdown Menu */}
                {showModelDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border py-1 min-w-[160px] z-50">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                          selectedModel === model.id ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-gray-700"
                        }`}
                      >
                        <img src={model.logo} alt="" className="h-4 w-4 object-contain" />
                        <span className="font-medium">{model.name}</span>
                        {selectedModel === model.id && (
                          <span className="ml-auto text-[var(--accent-primary-light)]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isGenerating}
                className="w-8 h-8 bg-[var(--accent-primary)] text-white rounded-full flex items-center justify-center hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep old export for backward compatibility
export const AIImagePanel = AIImagePanelCard;
