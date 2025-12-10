"use client";

import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Maximize2, Settings, ImagePlus, Sparkles } from "lucide-react";

interface DocumentToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen: () => void;
  onAddMedia: () => void;
  onCreateImage: () => void;
}

export function DocumentToolbar({
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onAddMedia,
  onCreateImage,
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
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border py-2">
          <button
            type="button"
            onClick={() => {
              onAddMedia();
              setShowSettings(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ImagePlus className="h-4 w-4 text-gray-500" />
            <span>Add Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCreateImage();
              setShowSettings(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-gray-500" />
            <span>Create Image</span>
          </button>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-xl shadow-lg border">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onZoomReset}
          className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors min-w-[50px]"
          title="Reset zoom"
        >
          {zoom}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={onFitToScreen}
          className="p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
          title="Fit to screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-lg transition-colors ${
            showSettings
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
