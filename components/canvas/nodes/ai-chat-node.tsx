"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { AIChatNodeData, AIModel, Message } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Copy, 
  Maximize2,
  Minimize2,
  Sparkles,
  Link2,
  Settings,
  ChevronDown,
  Bot,
  User,
  Loader2,
  RefreshCw
} from "lucide-react";

const AI_MODELS: { id: AIModel; name: string; icon: string }[] = [
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", icon: "🟣" },
  { id: "claude-opus-4", name: "Claude Opus 4", icon: "🟣" },
  { id: "gpt-4o", name: "GPT-4o", icon: "🟢" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", icon: "🟢" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", icon: "🔵" },
];

function AIChatNode({ id, data, selected }: NodeProps<AIChatNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { deleteNode, duplicateNode, updateNode, getConnectedNodes, buildAIContext } = useCanvasStore();

  const currentModel = AI_MODELS.find(m => m.id === data.model) || AI_MODELS[0];
  const connectedNodes = getConnectedNodes(id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.conversation]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const handleModelChange = (model: AIModel) => {
    updateNode(id, { model });
    setShowModelDropdown(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message
    const newConversation = [...(data.conversation || []), userMessage];
    updateNode(id, { conversation: newConversation });
    setInputValue("");
    setIsGenerating(true);

    try {
      // Build context from connected nodes
      const connectedIds = connectedNodes.map(n => n.id);
      const context = buildAIContext(connectedIds);

      // Call AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newConversation,
          model: data.model,
          context: context,
          systemPrompt: data.systemPrompt,
        }),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: result.content || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
      };

      updateNode(id, { 
        conversation: [...newConversation, assistantMessage] 
      });
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
        timestamp: new Date(),
      };
      updateNode(id, { 
        conversation: [...newConversation, errorMessage] 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    updateNode(id, { conversation: [] });
  };

  return (
    <div
      className={`
        relative bg-white rounded-xl border shadow-lg overflow-hidden
        transition-all duration-200
        ${selected ? "ring-2 ring-violet-500 border-violet-500" : "border-gray-200"}
      `}
      style={{ width: 360, height: isExpanded ? 420 : 60 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowModelDropdown(false);
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
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-violet-600" />
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowModelDropdown(!showModelDropdown);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white/50 rounded-md transition-colors"
            >
              <span>{currentModel.icon}</span>
              <span>{currentModel.name}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border z-50">
                {AI_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelChange(model.id);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      model.id === data.model ? "bg-violet-50 text-violet-700" : "text-gray-700"
                    }`}
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {connectedNodes.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full mr-1">
              <Link2 className="h-2.5 w-2.5" />
              <span>{connectedNodes.length}</span>
            </div>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
              updateNode(id, { isExpanded: !isExpanded });
            }}
            className="p-1 hover:bg-white/50 rounded text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

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

      {/* Chat Content (only when expanded) */}
      {isExpanded && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: 290 }}>
            {(!data.conversation || data.conversation.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-violet-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">Start a conversation</p>
                <p className="text-xs text-gray-400">
                  Connect assets to provide context
                </p>
              </div>
            ) : (
              <>
                {data.conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3.5 w-3.5 text-violet-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                        message.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <div className="px-3 py-2 bg-gray-100 rounded-xl">
                      <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                className="flex-1 resize-none text-sm p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 max-h-20"
                rows={1}
                disabled={isGenerating}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isGenerating}
                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {data.conversation && data.conversation.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                Clear chat
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default memo(AIChatNode);
