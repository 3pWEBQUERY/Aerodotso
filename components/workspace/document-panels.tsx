"use client";

import { useState, useEffect } from "react";
import { ImageIcon, File, Star, X, Pencil, Download, Maximize2, Home, ChevronRight, PanelRight } from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
  mime_type: string;
  previewUrl?: string;
  is_starred?: boolean;
  created_at: string;
}

interface OpenPanel {
  id: string;
  docId: string;
  width: number;
}

interface DocumentPanelsProps {
  documents: Document[];
  workspaceId: string;
}

export function useDocumentPanels() {
  const [openPanels, setOpenPanels] = useState<OpenPanel[]>([]);
  const [resizing, setResizing] = useState<string | null>(null);

  const openInPanel = (docId: string) => {
    if (openPanels.length >= 4) return;
    if (openPanels.some(p => p.docId === docId)) return;
    setOpenPanels(prev => [...prev, { id: crypto.randomUUID(), docId, width: 400 }]);
  };

  const closePanel = (panelId: string) => {
    setOpenPanels(prev => prev.filter(p => p.id !== panelId));
  };

  const handleMouseDown = (panelId: string) => {
    setResizing(panelId);
  };

  useEffect(() => {
    if (!resizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setOpenPanels(prev => prev.map(p => {
        if (p.id === resizing) {
          const newWidth = Math.max(200, p.width - e.movementX);
          return { ...p, width: newWidth };
        }
        return p;
      }));
    };

    const handleMouseUp = () => setResizing(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  return { openPanels, openInPanel, closePanel, handleMouseDown };
}

export function DocumentSidebarItem({ 
  doc, 
  workspaceId, 
  onOpenInPanel 
}: { 
  doc: Document; 
  workspaceId: string; 
  onOpenInPanel: (docId: string) => void;
}) {
  return (
    <div className="group flex items-center rounded-md hover:bg-muted mb-0.5 overflow-hidden">
      <Link
        href={`/workspace/${workspaceId}/document/${doc.id}`}
        className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground"
      >
        {doc.mime_type === "application/pdf" ? (
          <img src="/pdf-icon.svg" alt="PDF" className="h-3 w-3 flex-shrink-0" />
        ) : (
          <ImageIcon className="h-3 w-3 flex-shrink-0" />
        )}
        <span className="truncate max-w-[80px]">{doc.title}</span>
      </Link>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onOpenInPanel(doc.id); }}
        className="p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
        title="Open in panel"
      >
        <PanelRight className="h-3 w-3" />
      </button>
    </div>
  );
}

export function DocumentPanels({ documents, workspaceId, openPanels, closePanel, handleMouseDown }: DocumentPanelsProps & {
  openPanels: OpenPanel[];
  closePanel: (id: string) => void;
  handleMouseDown: (id: string) => void;
}) {
  return (
    <>
      {openPanels.map((panel) => {
        const doc = documents.find(d => d.id === panel.docId);
        if (!doc) return null;
        return (
          <div
            key={panel.id}
            className="flex-shrink-0 border-l flex bg-white relative"
            style={{ width: panel.width }}
          >
            {/* Resize Handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[var(--accent-primary)]/100/50 z-10"
              onMouseDown={() => handleMouseDown(panel.id)}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Panel Header */}
              <div className="h-10 border-b flex items-center justify-between px-3 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground truncate">
                  <Home className="h-3 w-3" />
                  <ChevronRight className="h-3 w-3" />
                  <ImageIcon className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{doc.title}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-[10px]">Edited {new Date(doc.created_at).toLocaleDateString()}</span>
                  <button type="button" className="p-1 hover:bg-muted rounded">
                    <Star className={`h-3 w-3 ${doc.is_starred ? "text-amber-500 fill-amber-500" : ""}`} />
                  </button>
                  <button type="button" onClick={() => closePanel(panel.id)} className="p-1 hover:bg-muted rounded">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Panel Toolbar */}
              <div className="flex items-center justify-end px-3 py-2 border-b">
                <div className="flex items-center gap-1 bg-white border rounded-full shadow-sm px-1.5 py-0.5">
                  <button type="button" className="p-1.5 hover:bg-muted rounded-full">
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button type="button" className="p-1.5 hover:bg-muted rounded-full">
                    <Download className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => doc.previewUrl && window.open(doc.previewUrl, "_blank")}
                    className="p-1.5 hover:bg-muted rounded-full"
                  >
                    <Maximize2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
                {doc.mime_type?.startsWith("image/") && doc.previewUrl ? (
                  <img
                    src={doc.previewUrl}
                    alt={doc.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                ) : doc.mime_type === "application/pdf" && doc.previewUrl ? (
                  <iframe
                    src={`${doc.previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded-lg border shadow-lg bg-white"
                    title={doc.title}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <File className="h-16 w-16" />
                    <p className="text-xs">Preview not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
