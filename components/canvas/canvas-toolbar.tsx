"use client";

import { Plus, Flag, Type, Pencil, ArrowRight, Square } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Custom Select cursor icon
const SelectIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7 2-3 7-4-18z" />
  </svg>
);

// Custom Hand/Pan icon
const HandIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

// AI Icon (white version)
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

export type CanvasTool = "select" | "pan" | "insert" | "note" | "chat" | "text" | "draw" | "arrow" | "shape";

interface CanvasToolbarProps {
  activeTool?: CanvasTool;
  onToolChange?: (tool: CanvasTool) => void;
  onInsertFromWorkspace?: () => void;
  onCreateNote?: () => void;
  onOpenChat?: () => void;
  onCreateText?: () => void;
  onStartDrawing?: () => void;
  onCreateArrow?: () => void;
  onCreateShape?: () => void;
}

export function CanvasToolbar({ 
  activeTool = "select", 
  onToolChange,
  onInsertFromWorkspace,
  onCreateNote,
  onOpenChat,
  onCreateText,
  onStartDrawing,
  onCreateArrow,
  onCreateShape,
}: CanvasToolbarProps) {
  const tools: Array<{
    id: CanvasTool | "divider";
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    shortcut?: string;
    type?: "divider";
    action?: () => void;
  }> = [
    { id: "select", icon: SelectIcon, label: "Select Tool", shortcut: "V" },
    { id: "pan", icon: HandIcon, label: "Hand Tool", shortcut: "H" },
    { id: "divider", type: "divider", label: "" },
    { id: "insert", icon: Plus, label: "Insert from Workspace", shortcut: "I", action: onInsertFromWorkspace },
    { id: "note", icon: Flag, label: "Create Note", shortcut: "N", action: onCreateNote },
    { id: "chat", icon: AIIcon, label: "Chat", shortcut: "C", action: onOpenChat },
    { id: "text", icon: Type, label: "Text", shortcut: "T", action: onCreateText },
    { id: "draw", icon: Pencil, label: "Draw", shortcut: "D", action: onStartDrawing },
    { id: "arrow", icon: ArrowRight, label: "Arrow", shortcut: "A", action: onCreateArrow },
    { id: "shape", icon: Square, label: "Shapes", shortcut: "S", action: onCreateShape },
  ];

  const handleToolClick = (tool: typeof tools[number]) => {
    if (tool.type === "divider") return;
    
    // For select and pan, change the active tool
    if (tool.id === "select" || tool.id === "pan") {
      onToolChange?.(tool.id);
    } else {
      // For other tools, trigger their action
      tool.action?.();
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          {tools.map((tool) => {
            if (tool.type === "divider") {
              return <div key={tool.id} className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--workspace-sidebar-border)' }} />;
            }
            
            const Icon = tool.icon!;
            const isActive = activeTool === tool.id;
            
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleToolClick(tool);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`p-2 rounded-lg transition-colors ${
                      isActive 
                        ? "bg-[var(--workspace-sidebar-muted)]" 
                        : "hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                    style={{ color: isActive ? 'var(--accent-primary-light)' : 'var(--workspace-sidebar-muted-foreground)' }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  <span>{tool.label}</span>
                  {tool.shortcut && (
                    <span className="ml-2 text-gray-400 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                      {tool.shortcut}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
