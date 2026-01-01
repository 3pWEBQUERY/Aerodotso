"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  Download, 
  Maximize2,
  RotateCw,
  PanelLeftClose,
  PanelLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Set up pdf.js worker using a local bundled worker to avoid cross-origin fetch failures
const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfViewerContentProps {
  url: string;
  title?: string;
}

export function PdfViewerContent({ url, title }: PdfViewerContentProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.3);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);
  const fileObjectRef = useRef<{ data: ArrayBuffer } | null>(null);

  // Fetch PDF as ArrayBuffer to avoid worker-side fetch/CORS issues
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsFetchingFile(true);
      setError(null);
      setNumPages(0);
      setCurrentPage(1);
      setFileData(null);

      try {
        const proxiedUrl = `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxiedUrl, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const buffer = await res.arrayBuffer();
        if (!cancelled) {
          // Clone the ArrayBuffer to prevent detachment issues
          const clonedBuffer = buffer.slice(0);
          setFileData(clonedBuffer);
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        console.error("PDF fetch error", err);
        setError("PDF konnte nicht geladen werden.");
      } finally {
        if (!cancelled) {
          setIsFetchingFile(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("PDF load error", err);
    setError("PDF konnte nicht geladen werden.");
  };

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
    }
  }, [numPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.3);
  }, []);

  const rotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = title || "document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [url, title]);

  const handleOpenFullscreen = useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  // Memoize the file object to prevent unnecessary reloads
  const fileObject = useMemo(() => {
    if (!fileData) {
      fileObjectRef.current = null;
      return null;
    }
    // Reuse the same object reference if the ArrayBuffer hasn't changed
    if (fileObjectRef.current && fileObjectRef.current.data === fileData) {
      return fileObjectRef.current;
    }
    fileObjectRef.current = { data: fileData };
    return fileObjectRef.current;
  }, [fileData]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-1">
          {/* Sidebar Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showSidebar ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Page Navigation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={prevPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Vorherige Seite</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5 px-2">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) goToPage(val);
              }}
              className="w-12 h-7 text-center text-sm bg-background border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-sm text-muted-foreground">/ {numPages || "..."}</span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={nextPage}
                disabled={currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Nächste Seite</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={zoomOut}
                disabled={scale <= 0.5}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Verkleinern</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground min-w-[60px]"
                onClick={resetZoom}
              >
                {Math.round(scale * 100)}%
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom zurücksetzen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={zoomIn}
                disabled={scale >= 3}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Vergrößern</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Rotate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={rotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Drehen</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Download & Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Herunterladen</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleOpenFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">In neuem Tab öffnen</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {!fileData ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isFetchingFile ? "PDF wird geladen..." : "PDF konnte nicht geladen werden."}
              </p>
            </div>
          </div>
        ) : (
          <Document
            file={fileObject}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">PDF wird geladen...</p>
                </div>
              </div>
            }
            className="flex flex-1 overflow-hidden"
          >
          {/* Thumbnail Sidebar */}
          {showSidebar && numPages > 0 && (
            <div className="w-[140px] border-r bg-muted/20 flex-shrink-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={cn(
                        "w-full rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50",
                        currentPage === pageNum
                          ? "border-primary shadow-md"
                          : "border-transparent"
                      )}
                    >
                      <div className="relative bg-white">
                        <Page
                          pageNumber={pageNum}
                          width={120}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                      <div className={cn(
                        "text-[11px] py-1 text-center",
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted/50 text-muted-foreground"
                      )}>
                        {pageNum}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* PDF Page View */}
          <div className="flex-1 overflow-auto bg-muted/30">
            <div className="min-h-full flex items-start justify-center p-4">
              <div className="shadow-xl rounded-sm bg-white">
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </Document>
        )}
      </div>
    </div>
  );
}
