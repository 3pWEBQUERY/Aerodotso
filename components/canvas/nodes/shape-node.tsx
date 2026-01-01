"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { NodeProps, NodeResizer, useReactFlow } from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Square, 
  Circle, 
  Triangle, 
  Sun, 
  CornerUpRight, 
  Copy, 
  Trash2,
  Check,
  X,
  Loader2,
  ChevronDown
} from "lucide-react";
import { ShapeNodeData, ShapeType, ShapeBackgroundColor } from "@/lib/canvas/types";
import { useCanvasStore } from "@/lib/canvas/store";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// AI Icon Component (white version)
const AIIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 0 122.3 122.28" 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <g>
        <path d="M62.84,76.47c-2.1,0-3.79-1.7-3.79-3.79v-15.4c0-2.13-1.73-3.86-3.86-3.86s-3.86,1.73-3.86,3.86v15.4c0,2.1-1.7,3.79-3.79,3.79s-3.79-1.7-3.79-3.79v-15.4c0-6.31,5.14-11.45,11.45-11.45s11.45,5.14,11.45,11.45v15.4c0,2.1-1.7,3.79-3.79,3.79Z"/>
        <path d="M62.84,68.09h-15.32c-2.1,0-3.79-1.7-3.79-3.79s1.7-3.79,3.79-3.79h15.32c2.1,0,3.79,1.7,3.79,3.79s-1.7,3.79-3.79,3.79Z"/>
        <path d="M74.8,76.47c-2.1,0-3.79-1.7-3.79-3.79v-23.06c0-2.1,1.7-3.79,3.79-3.79s3.79,1.7,3.79,3.79v23.06c0,2.1-1.7,3.79-3.79,3.79Z"/>
      </g>
      <path d="M105.4,64.94c-1.25,0-2.48-.62-3.2-1.76-5.25-8.25-11.73-16.26-19.27-23.8C53.5,9.96,22.48,1.45,11.97,11.96c-6.46,6.47-5.74,19.93,1.95,36.02,.9,1.89,.1,4.16-1.79,5.06-1.89,.9-4.15,.1-5.06-1.79C-2.19,31.84-2.36,15.57,6.61,6.59c15.21-15.21,51.09-3.17,81.68,27.42,7.93,7.93,14.76,16.37,20.31,25.09,1.13,1.77,.6,4.11-1.16,5.24-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M97.83,122.25c-17.92,0-42.51-12.7-63.79-33.98-7.93-7.93-14.76-16.37-20.31-25.09-1.13-1.77-.6-4.11,1.16-5.24,1.77-1.13,4.12-.6,5.24,1.16,5.25,8.25,11.73,16.26,19.27,23.8,24.15,24.15,53.14,37,67.43,29.93,1.87-.93,4.15-.17,5.08,1.71,.93,1.88,.16,4.15-1.71,5.08-3.56,1.77-7.75,2.61-12.38,2.61Z"/>
      <path d="M113.03,116.81c-.97,0-1.94-.37-2.68-1.11-1.48-1.48-1.48-3.88,0-5.37,1.22-1.21,2.19-2.69,2.9-4.38,.81-1.93,3.04-2.84,4.96-2.04,1.93,.81,2.84,3.03,2.04,4.96-1.09,2.61-2.62,4.91-4.54,6.82-.74,.74-1.71,1.11-2.68,1.11Z"/>
      <path d="M116.75,111.21c-.49,0-.99-.1-1.46-.3-1.93-.81-2.84-3.03-2.03-4.96,3.05-7.27,1.28-18.81-4.85-31.64-.9-1.89-.1-4.16,1.79-5.06,1.89-.9,4.16-.1,5.06,1.79,7.16,15,8.94,28.44,5,37.84-.61,1.45-2.02,2.33-3.5,2.33Z"/>
      <path d="M61.17,109.17c-1.25,0-2.48-.62-3.2-1.76-1.13-1.77-.6-4.11,1.16-5.24,8.25-5.25,16.26-11.73,23.8-19.27,29.42-29.42,37.93-60.44,27.42-70.95-6.28-6.28-19.33-5.75-34.9,1.42-1.91,.88-4.16,.04-5.03-1.86-.88-1.9-.05-4.16,1.86-5.03,18.85-8.69,34.69-8.65,43.44,.11,15.21,15.21,3.17,51.09-27.42,81.68-7.93,7.93-16.37,14.76-25.09,20.31-.63,.4-1.34,.59-2.03,.59Z"/>
      <path d="M24.64,122.28c-7.46,0-13.65-2.2-18.03-6.58-15.21-15.21-3.17-51.09,27.42-81.68,7.77-7.77,16.04-14.5,24.59-19.98,1.76-1.14,4.11-.62,5.24,1.14,1.13,1.76,.62,4.11-1.14,5.24-8.08,5.2-15.93,11.58-23.32,18.97-13.47,13.47-23.63,28.54-28.63,42.44-4.59,12.77-4.15,23.16,1.2,28.51,6.14,6.14,18.85,5.76,34-1.01,1.91-.85,4.16,0,5.01,1.91s0,4.16-1.91,5.01c-9,4.03-17.3,6.03-24.43,6.03Z"/>
    </g>
  </svg>
);

// Flower color picker - rainbow arranged in petals (expanded with darks)
const FLOWER_COLORS = {
  center: '#ffffff',
  // Ring 6 (outermost) - very light pastels
  ring6: [
    '#fff0f0', '#fff5f0', '#fffcf0', '#f0fff0', '#f0faff', '#f5f0ff', '#fff0fa', '#f0fffc',
    '#ffe8e8', '#ffede8', '#fff9e8', '#e8ffe8', '#e8f5ff', '#ede8ff', '#ffe8f5', '#e8fff9',
  ],
  // Ring 5 - light pastels
  ring5: [
    '#ffb3ba', '#ffcba4', '#ffffba', '#baffc9', '#bae1ff', '#d4baff', '#ffbaed', '#baffef',
    '#ffc9c9', '#ffddb3', '#ffffc9', '#c9ffd9', '#c9e8ff', '#e0c9ff', '#ffc9e8', '#c9fff5',
  ],
  // Ring 4 - medium saturation
  ring4: [
    '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f06595', '#38d9a9',
    '#ff8585', '#ffba66', '#ffdd55', '#85e89d', '#66b8ff', '#aa8aff', '#ff7aa8', '#55e6be',
  ],
  // Ring 3 - saturated/vibrant colors
  ring3: [
    '#ff0000', '#ff6600', '#ffff00', '#00ff00', '#0088ff', '#6600ff', '#ff0088', '#00ffcc',
    '#ff3333', '#ff7700', '#ffcc00', '#33cc66', '#3399ff', '#7733ff', '#ff3399', '#00ccaa',
  ],
  // Ring 2 - dark colors
  ring2: [
    '#cc0000', '#cc5500', '#999900', '#006600', '#004499', '#440099', '#990044', '#006655',
    '#990000', '#994400', '#666600', '#004400', '#003366', '#330066', '#660033', '#004d40',
  ],
  // Ring 1 (innermost) - very dark colors + grays
  ring1: [
    '#660000', '#663300', '#555500', '#003300', '#002244', '#220044', '#440022', '#003333',
    '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3',
  ],
};

// Animated color button component
const ColorButton = ({ 
  color, 
  isSelected, 
  onClick, 
  size = 32,
  style 
}: { 
  color: string; 
  isSelected: boolean; 
  onClick: () => void; 
  size?: number;
  style?: React.CSSProperties;
}) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "absolute rounded-full focus:outline-none",
      isSelected && "ring-2 ring-white z-20"
    )}
    style={{
      backgroundColor: color,
      width: size,
      height: size,
      ...style,
    }}
    initial={{ scale: 1 }}
    whileHover={{ 
      scale: 1.3, 
      zIndex: 30,
      boxShadow: "0 0 20px rgba(255,255,255,0.5)"
    }}
    whileTap={{ scale: 0.95 }}
    transition={{ 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }}
  />
);

const SHAPE_COLORS: { color: ShapeBackgroundColor; label: string }[] = [
  { color: 'transparent', label: 'Transparent' },
  { color: '#ffffff', label: 'White' },
  { color: '#e5e7eb', label: 'Gray' },
  { color: '#fef3c7', label: 'Yellow' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#fecaca', label: 'Red' },
  { color: '#d9f99d', label: 'Lime' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#a5f3fc', label: 'Cyan' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#ddd6fe', label: 'Purple' },
  { color: '#fbcfe8', label: 'Pink' },
  { color: '#1f2937', label: 'Dark' },
];

const SHAPE_TYPES: { type: ShapeType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'triangle', icon: Triangle, label: 'Triangle' },
];

interface ShapeToolbarProps {
  nodeId: string;
  data: ShapeNodeData;
  onUpdate: (updates: Partial<ShapeNodeData>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ShapeToolbar({ nodeId, data, onUpdate, onDuplicate, onDelete }: ShapeToolbarProps) {
  const [showShapeTypeMenu, setShowShapeTypeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  
  const shapeTypeRef = useRef<HTMLDivElement>(null);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shapeTypeRef.current && !shapeTypeRef.current.contains(e.target as Node)) {
        setShowShapeTypeMenu(false);
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setShowColorMenu(false);
      }
      if (aiChatRef.current && !aiChatRef.current.contains(e.target as Node)) {
        setShowAIChat(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAISubmit = async () => {
    if (!aiMessage.trim() || aiLoading) return;
    
    const userMessage = aiMessage.trim();
    setAiMessage("");
    setAiLoading(true);
    setAiConversation(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant for a canvas shape tool. Help the user with their shape-related questions. Keep responses concise.' },
            ...aiConversation.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          model: "gemini-3-flash-preview"
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiConversation(prev => [...prev, { role: 'assistant', content: data.content || data.message || 'No response' }]);
      } else {
        setAiConversation(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      setAiConversation(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const selectedCount = useCanvasStore.getState().selectedNodeIds.length;

  return (
    <TooltipProvider delayDuration={200}>
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 z-50"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border"
          style={{
            backgroundColor: "var(--workspace-sidebar)",
            borderColor: "var(--workspace-sidebar-border)",
          }}
        >
          {/* Selected count */}
          <span className="text-xs text-white/80 px-2 whitespace-nowrap">
            {selectedCount} selected
          </span>
          
          <div className="w-px h-5 mx-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

          {/* AI Chat */}
          <div className="relative" ref={aiChatRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowAIChat(!showAIChat)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors hover:bg-[var(--workspace-sidebar-muted)]",
                    showAIChat ? "text-white bg-[var(--workspace-sidebar-muted)]" : "text-[var(--workspace-sidebar-muted-foreground)]"
                  )}
                >
                  <AIIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>AI Chat</TooltipContent>
            </Tooltip>

            {showAIChat && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border p-4 z-50">
                <div className="flex flex-col h-64">
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                    {aiConversation.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                          <AIIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Start a conversation</p>
                        <p className="text-xs text-gray-500">Type your message below to begin chatting</p>
                      </div>
                    ) : (
                      aiConversation.map((msg, i) => (
                        <div key={i} className={cn(
                          "text-xs p-2 rounded-lg",
                          msg.role === 'user' ? "bg-blue-50 text-blue-900 ml-4" : "bg-gray-50 text-gray-700 mr-4"
                        )}>
                          {msg.content}
                        </div>
                      ))
                    )}
                    {aiLoading && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 p-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Thinking...
                      </div>
                    )}
                  </div>
                  
                  {/* Input */}
                  <div className="flex items-center gap-2 border rounded-lg p-2">
                    <input
                      type="text"
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
                      placeholder="What do you want to create?"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                    <button className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      <AIIcon className="h-3 w-3" />
                      Best
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shape Type */}
          <div className="relative" ref={shapeTypeRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowShapeTypeMenu(!showShapeTypeMenu)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors hover:bg-[var(--workspace-sidebar-muted)]",
                    showShapeTypeMenu ? "text-white bg-[var(--workspace-sidebar-muted)]" : "text-[var(--workspace-sidebar-muted-foreground)]"
                  )}
                >
                  <Square className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Shape Type</TooltipContent>
            </Tooltip>

            {showShapeTypeMenu && (
              <div
                className="absolute top-full left-0 mt-2 w-32 bg-white rounded-xl shadow-2xl border p-2 z-50"
                style={{
                  backgroundColor: "var(--workspace-sidebar)",
                  borderColor: "var(--workspace-sidebar-border)",
                }}
              >
                <p className="text-[10px] text-white/60 uppercase tracking-wider px-2 mb-1">Shape Type</p>
                {SHAPE_TYPES.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      onUpdate({ shapeType: type });
                      setShowShapeTypeMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                      data.shapeType === type
                        ? "bg-[var(--accent-primary)]/20 text-white border border-[var(--accent-primary)]/40"
                        : "text-white/80 hover:bg-[var(--workspace-sidebar-muted)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Shadow */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onUpdate({ hasShadow: !data.hasShadow })}
                className={cn(
                  "p-1.5 rounded-lg transition-colors hover:bg-[var(--workspace-sidebar-muted)]",
                  data.hasShadow ? "text-white bg-[var(--workspace-sidebar-muted)]" : "text-[var(--workspace-sidebar-muted-foreground)]"
                )}
              >
                <Sun className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Toggle Shadow</TooltipContent>
          </Tooltip>

          {/* Toggle Rounded Corners */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onUpdate({ hasRoundedCorners: !data.hasRoundedCorners })}
                className={cn(
                  "p-1.5 rounded-lg transition-colors hover:bg-[var(--workspace-sidebar-muted)]",
                  data.hasRoundedCorners ? "text-white bg-[var(--workspace-sidebar-muted)]" : "text-[var(--workspace-sidebar-muted-foreground)]"
                )}
              >
                <CornerUpRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Toggle Rounded Corners</TooltipContent>
          </Tooltip>

          {/* Background Colors */}
          <div className="relative" ref={colorMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowColorMenu(!showColorMenu)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors hover:bg-[var(--workspace-sidebar-muted)]",
                    showColorMenu ? "bg-[var(--workspace-sidebar-muted)]" : ""
                  )}
                >
                  <div 
                    className="h-4 w-4 rounded-full border-2"
                    style={{ 
                      borderColor: "rgba(255,255,255,0.35)",
                      backgroundColor: data.backgroundColor === 'transparent' ? 'transparent' : data.backgroundColor,
                      backgroundImage: data.backgroundColor === 'transparent' 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : 'none',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>Background Color</TooltipContent>
            </Tooltip>

            {showColorMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-full shadow-2xl border-2 z-50"
                style={{
                  backgroundColor: "#1a1a2e",
                  borderColor: "#00d4ff",
                  padding: "6px",
                }}
              >
                {/* Flower Color Picker - 6 rings with 16 colors each = 96 colors */}
                <div className="relative w-[300px] h-[300px]">
                  {/* Ring 6 (outermost) - very light pastels */}
                  {FLOWER_COLORS.ring6.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90;
                    const radius = 135;
                    const cx = 150;
                    const cy = 150;
                    const size = 32;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring6-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}

                  {/* Ring 5 - light pastels (offset) */}
                  {FLOWER_COLORS.ring5.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90 + 11.25;
                    const radius = 110;
                    const cx = 150;
                    const cy = 150;
                    const size = 30;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring5-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}

                  {/* Ring 4 - medium saturation */}
                  {FLOWER_COLORS.ring4.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90;
                    const radius = 85;
                    const cx = 150;
                    const cy = 150;
                    const size = 28;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring4-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}
                  
                  {/* Ring 3 - vibrant colors (offset) */}
                  {FLOWER_COLORS.ring3.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90 + 11.25;
                    const radius = 62;
                    const cx = 150;
                    const cy = 150;
                    const size = 26;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring3-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}
                  
                  {/* Ring 2 - dark colors */}
                  {FLOWER_COLORS.ring2.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90;
                    const radius = 40;
                    const cx = 150;
                    const cy = 150;
                    const size = 24;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring2-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}
                  
                  {/* Ring 1 (innermost) - very dark + grays */}
                  {FLOWER_COLORS.ring1.map((color: string, index: number) => {
                    const angle = (index * 360) / 16 - 90 + 11.25;
                    const radius = 18;
                    const cx = 150;
                    const cy = 150;
                    const size = 20;
                    const x = cx + radius * Math.cos((angle * Math.PI) / 180) - size / 2;
                    const y = cy + radius * Math.sin((angle * Math.PI) / 180) - size / 2;
                    return (
                      <ColorButton
                        key={`ring1-${index}`}
                        color={color}
                        isSelected={data.backgroundColor === color}
                        onClick={() => {
                          onUpdate({ backgroundColor: color as ShapeBackgroundColor });
                          setShowColorMenu(false);
                        }}
                        size={size}
                        style={{ left: x, top: y }}
                      />
                    );
                  })}
                  
                  {/* Center - white */}
                  <motion.button
                    onClick={() => {
                      onUpdate({ backgroundColor: '#ffffff' as ShapeBackgroundColor });
                      setShowColorMenu(false);
                    }}
                    className={cn(
                      "absolute rounded-full focus:outline-none",
                      data.backgroundColor === '#ffffff' && "ring-2 ring-cyan-400 z-20"
                    )}
                    style={{
                      left: 150 - 14,
                      top: 150 - 14,
                      width: 28,
                      height: 28,
                      backgroundColor: '#ffffff',
                    }}
                    whileHover={{ 
                      scale: 1.2,
                      boxShadow: "0 0 15px rgba(255,255,255,0.8)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="w-px h-5 mx-1" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

          {/* Duplicate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDuplicate}
                className="p-1.5 rounded-lg transition-colors text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Duplicate</TooltipContent>
          </Tooltip>

          {/* Delete */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg transition-colors text-red-300 hover:bg-red-500/20 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ShapeNode({ id, data, selected }: NodeProps<ShapeNodeData>) {
  const { updateNode, deleteNodes, addNode } = useCanvasStore();
  const { getNode } = useReactFlow();

  const handleUpdate = useCallback((updates: Partial<ShapeNodeData>) => {
    updateNode(id, { ...data, ...updates });
  }, [id, data, updateNode]);

  const handleDuplicate = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const newNode = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      data: { ...data, label: `${data.label} (copy)` },
    };
    addNode(newNode as any);
  }, [id, data, getNode, addNode]);

  const handleDelete = useCallback(() => {
    deleteNodes([id]);
  }, [id, deleteNodes]);

  // Render shape based on type
  const renderShape = () => {
    const baseStyles = cn(
      "w-full h-full transition-all duration-200",
      data.hasShadow && "shadow-lg",
      data.hasRoundedCorners && data.shapeType === 'rectangle' && "rounded-xl"
    );

    const bgColor = data.backgroundColor === 'transparent' ? 'transparent' : data.backgroundColor;

    switch (data.shapeType) {
      case 'circle':
        return (
          <div 
            className={cn(baseStyles, "rounded-full")}
            style={{ backgroundColor: bgColor }}
          />
        );
      case 'triangle':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <polygon 
                points="50,5 95,95 5,95" 
                fill={bgColor}
                className={cn(data.hasShadow && "drop-shadow-lg")}
                style={{ 
                  filter: data.hasShadow ? 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))' : 'none'
                }}
              />
            </svg>
          </div>
        );
      case 'rectangle':
      default:
        return (
          <div 
            className={baseStyles}
            style={{ backgroundColor: bgColor }}
          />
        );
    }
  };

  return (
    <>
      <NodeResizer
        minWidth={50}
        minHeight={50}
        isVisible={selected}
        lineClassName="!border-blue-400"
        handleClassName="!w-2 !h-2 !bg-white !border-2 !border-blue-400 !rounded"
        onResize={(_, params) => {
          handleUpdate({ width: params.width, height: params.height });
        }}
      />

      {selected && (
        <ShapeToolbar
          nodeId={id}
          data={data}
          onUpdate={handleUpdate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      )}

      <div 
        className="relative"
        style={{ 
          width: data.width || 200, 
          height: data.height || 100 
        }}
      >
        {renderShape()}
      </div>
    </>
  );
}

export default memo(ShapeNode);
