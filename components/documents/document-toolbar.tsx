"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Maximize2, Settings, ImagePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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

interface DocumentToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen: () => void;
  onAddMedia: () => void;
  onCreateImage: () => void;
  onOpenPreview?: () => void;
}

export function DocumentToolbar({
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onAddMedia,
  onCreateImage,
  onOpenPreview,
}: DocumentToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={dropdownRef}>
      {/* Settings Dropdown - positioned above the toolbar */}
      {showSettings && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-lg border border-[var(--workspace-sidebar-border)] py-2" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          <button
            type="button"
            onClick={() => {
              onAddMedia();
              setShowSettings(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] transition-colors"
          >
            <ImagePlus className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            <span>Add Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCreateImage();
              setShowSettings(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] transition-colors"
          >
            <AIIcon className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            <span>Create Image</span>
          </button>
        </div>
      )}

      {/* Main Toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-lg border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onZoomOut}
                className="p-1.5 text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-[var(--workspace-sidebar-foreground)] rounded-lg transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Verkleinern</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onZoomReset}
                className="px-2 py-1 text-xs font-medium text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg transition-colors min-w-[50px]"
              >
                {zoom}%
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Zoom zurücksetzen</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onZoomIn}
                className="p-1.5 text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-[var(--workspace-sidebar-foreground)] rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Vergrößern</span>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-[var(--workspace-sidebar-border)] mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenPreview}
                className="p-1.5 text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-[var(--workspace-sidebar-foreground)] rounded-lg transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Vollbild anzeigen</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showSettings
                    ? "bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)]"
                    : "text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-[var(--workspace-sidebar-foreground)]"
                }`}
              >
                <Settings className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <span>Einstellungen</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
