"use client";

import { Pencil, Download, Maximize2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={300}>
      <div
        className="absolute top-4 right-4 flex items-center gap-1 rounded-xl shadow-lg px-2 py-1 z-10 border border-[var(--workspace-sidebar-border)]"
        style={{ backgroundColor: 'var(--workspace-sidebar)', transform: `scale(${100 / zoom})`, transformOrigin: "top right" }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onEdit}
              className="p-2 hover:bg-[var(--workspace-sidebar-muted)] rounded-xl"
            >
              <Pencil className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <span>Bearbeiten</span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onDownload}
              className="p-2 hover:bg-[var(--workspace-sidebar-muted)] rounded-xl"
            >
              <Download className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <span>Herunterladen</span>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenPreview}
              className="p-2 hover:bg-[var(--workspace-sidebar-muted)] rounded-xl"
            >
              <Maximize2 className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            <span>Vollbild anzeigen</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
