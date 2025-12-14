"use client";

import { Pencil, Download, Maximize2 } from "lucide-react";

interface DocumentFloatingToolbarProps {
  zoom: number;
  onDownload: () => void;
  onOpenPreview: () => void;
  onEdit?: () => void;
}

export function DocumentFloatingToolbar({
  zoom,
  onDownload,
  onOpenPreview,
  onEdit,
}: DocumentFloatingToolbarProps) {
  return (
    <div
      className="absolute top-4 right-4 flex items-center gap-1 bg-white border rounded-xl shadow-sm px-2 py-1 z-10"
      style={{ transform: `scale(${100 / zoom})`, transformOrigin: "top right" }}
    >
      <button
        type="button"
        onClick={onEdit}
        className="p-2 hover:bg-muted rounded-xl"
      >
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={onDownload}
        className="p-2 hover:bg-muted rounded-xl"
      >
        <Download className="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={onOpenPreview}
        className="p-2 hover:bg-muted rounded-xl"
      >
        <Maximize2 className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
