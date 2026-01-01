"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Maximize2, MessageCircle, Pencil, X } from "lucide-react";

interface ImageVersionInfo {
  id: string;
  url: string;
  label?: string;
  createdAt?: string | null;
  mimeType?: string | null;
  isOriginal?: boolean;
}

interface ImageDocumentViewerProps {
  id: string;
  title: string;
  url: string;
  mimeType?: string | null;
  createdAt?: string | null;
  versions?: ImageVersionInfo[];
}

interface DraftCommentPosition {
  x: number;
  y: number;
}

export function ImageDocumentViewer({
  id,
  title,
  url,
  mimeType,
  createdAt,
  versions,
}: ImageDocumentViewerProps) {
  const router = useRouter();
  const [currentTitle, setCurrentTitle] = useState(title);
  const [commentMode, setCommentMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [draftPosition, setDraftPosition] = useState<DraftCommentPosition | null>(
    null
  );
  const [draftText, setDraftText] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [isRenamingLoading, setIsRenamingLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [drawColor, setDrawColor] = useState("hsl(270.7 91% 65.1%)");
  const drawingContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSavingDrawing, setIsSavingDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const [versionList, setVersionList] = useState<ImageVersionInfo[]>(() => {
    if (versions && versions.length > 0) {
      return versions;
    }

    return [
      {
        id,
        url,
        label: "Original",
        createdAt: createdAt ?? null,
        mimeType: mimeType ?? null,
        isOriginal: true,
      },
    ];
  });
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);

  useEffect(() => {
    if (!drawingContainerRef.current || !canvasRef.current) return;
    const container = drawingContainerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;
    if (!width || !height) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, []);

  const handleEnterCommentMode = () => {
    setCommentMode(true);
    setShowHint(true);
    setDraftPosition(null);
    setDraftText("");
  };

  const handleStartRename = () => {
    setIsRenaming(true);
    setRenameValue(currentTitle);
    setRenameError(null);
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setRenameValue(currentTitle);
    setRenameError(null);
  };

  const handleSubmitRename = async () => {
    const nextTitle = renameValue.trim();
    if (!nextTitle || nextTitle === currentTitle) {
      setIsRenaming(false);
      setRenameValue(currentTitle);
      return;
    }

    setIsRenamingLoading(true);
    setRenameError(null);
    try {
      const res = await fetch("/api/documents/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, title: nextTitle }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Fehler beim Umbenennen");
      }

      setCurrentTitle(nextTitle);
      setIsRenaming(false);
    } catch (error: any) {
      setRenameError(error?.message ?? "Fehler beim Umbenennen");
    } finally {
      setIsRenamingLoading(false);
    }
  };

  const handleToggleDrawMode = () => {
    setDrawMode((prev) => {
      const next = !prev;
      if (next) {
        setCommentMode(false);
        setShowHint(false);
      }
      return next;
    });
  };

  const handleDiscardDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setIsDrawing(false);
    setDrawMode(false);
  };

  const handleSaveDrawing = async () => {
    if (!canvasRef.current || isSavingDrawing) {
      setDrawMode(false);
      setIsDrawing(false);
      return;
    }

    setIsSavingDrawing(true);
    setDrawError(null);

    try {
      const overlayCanvas = canvasRef.current;
      const baseUrl = versionList[0]?.url ?? url;

      const rect = overlayCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = overlayCanvas.width;
      exportCanvas.height = overlayCanvas.height;
      const exportCtx = exportCanvas.getContext("2d");
      if (!exportCtx) {
        throw new Error("Zeichnung konnte nicht vorbereitet werden.");
      }

      await new Promise<void>((resolve, reject) => {
        const baseImage = new window.Image();
        baseImage.crossOrigin = "anonymous";
        baseImage.onload = () => {
          try {
            exportCtx.drawImage(
              baseImage,
              0,
              0,
              exportCanvas.width,
              exportCanvas.height
            );
            exportCtx.drawImage(overlayCanvas, 0, 0);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        baseImage.onerror = () => {
          // Fallback: nur die Zeichnung speichern
          try {
            exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            exportCtx.drawImage(overlayCanvas, 0, 0);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        baseImage.src = baseUrl;
      });

      const blob: Blob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob((b) => {
          if (!b) {
            reject(new Error("Konnte Zeichnung nicht exportieren."));
          } else {
            resolve(b);
          }
        }, "image/png");
      });

      const file = new File([blob], `${currentTitle || "drawing"}.png`, {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentId", id);

      const res = await fetch("/api/documents/draw-save", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Fehler beim Speichern der Zeichnung");
      }

      const v = data?.version;
      if (v?.id && v?.signedUrl) {
        setVersionList((prev) => [
          ...prev,
          {
            id: v.id as string,
            url: v.signedUrl as string,
            createdAt: (v.created_at as string | null) ?? null,
            mimeType: (v.mime_type as string | null) ?? "image/png",
            isOriginal: false,
            label: v.label ?? undefined,
          },
        ]);
        setActiveVersionIndex((prev) => prev + 1);
      }

      const ctx = overlayCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      }

      setIsDrawing(false);
      setDrawMode(false);
    } catch (error: any) {
      setDrawError(
        error?.message ?? "Fehler beim Speichern der Zeichnung. Bitte erneut versuchen."
      );
    } finally {
      setIsSavingDrawing(false);
    }
  };

  const handleExitCommentMode = () => {
    setCommentMode(false);
    setShowHint(false);
    setDraftPosition(null);
    setDraftText("");
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!commentMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDraftPosition({ x, y });
    setShowHint(false);
  };

  const handleDrawPointerDown = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!drawMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDrawPointerMove = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!drawMode || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawPointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.closePath();
  };

  const handleDownload = async () => {
    if (typeof window === "undefined") return;
    const targetUrl = activeUrl;
    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = currentTitle || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: falls Download per Blob fehlschlägt, im neuen Tab öffnen
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenNewTab = () => {
    const targetUrl = activeUrl;
    if (typeof window === "undefined") return;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const activeVersion =
    versionList[activeVersionIndex] ?? versionList[0] ?? null;

  const displayDate = activeVersion?.createdAt
    ? new Date(activeVersion.createdAt).toLocaleDateString("de-DE")
    : null;

  const activeMimeType =
    activeVersion?.mimeType ?? mimeType ?? null;

  const activeUrl = activeVersion?.url ?? url;

  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] flex-col bg-background">
      <header className="flex items-center justify-between px-8 pt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="mr-2 flex h-7 w-7 items-center justify-center rounded-xl border border-transparent text-muted-foreground hover:border-border hover:bg-background"
            aria-label="Zurück"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <Link href="/documents" className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
            Home
          </Link>
          <span className="text-[11px] text-muted-foreground">/</span>
          {isRenaming ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitRename();
              }}
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => {
                  void handleSubmitRename();
                }}
                disabled={isRenamingLoading}
                className="max-w-[260px] truncate rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={handleStartRename}
              className="max-w-[260px] truncate text-[11px] text-foreground hover:underline"
            >
              {currentTitle}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {displayDate && (
            <span className="hidden sm:inline">Edited {displayDate}</span>
          )}
          {activeMimeType && (
            <span className="hidden sm:inline text-[11px]">{activeMimeType}</span>
          )}
          <div className="flex items-center gap-1 rounded-xl bg-muted px-2 py-1 shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-xl text-muted-foreground",
                    commentMode && "bg-background text-foreground shadow-sm"
                  )}
                  onClick={() =>
                    commentMode
                      ? handleExitCommentMode()
                      : handleEnterCommentMode()
                  }
                  aria-label="Add comment"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Comment</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-xl text-muted-foreground",
                    drawMode && "bg-background text-foreground shadow-sm"
                  )}
                  onClick={handleToggleDrawMode}
                  aria-label="Draw on image"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Draw</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-xl text-muted-foreground"
                  onClick={handleDownload}
                  aria-label="Download image"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-xl text-muted-foreground"
                  onClick={handleOpenNewTab}
                  aria-label="Open in new tab"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Open in new tab</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-4">
        {renameError && (
          <p className="mt-1 px-8 text-[11px] text-destructive">{renameError}</p>
        )}
        {drawError && (
          <p className="mt-1 px-8 text-[11px] text-destructive">{drawError}</p>
        )}

        <div
          className="relative max-h-[80vh] max-w-[70vw] overflow-hidden rounded-3xl bg-black/5 shadow-2xl"
          ref={drawingContainerRef}
          onClick={handleImageClick}
        >
          <div className="relative h-[min(70vh,720px)] w-[min(70vw,540px)] sm:h-[min(70vh,820px)] sm:w-[min(70vw,640px)]">
            <Image
              src={activeUrl}
              alt={currentTitle}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 640px, 90vw"
            />
          </div>

          <AnimatePresence>
            {drawMode && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute left-1/2 top-4 z-30 -translate-x-1/2"
              >
                <div className="flex items-center gap-2 rounded-xl bg-neutral-900/95 px-3 py-1.5 text-[11px] text-neutral-50 shadow-lg">
                  <button
                    type="button"
                    onClick={handleDiscardDrawing}
                    className="inline-flex items-center gap-1 rounded-xl bg-transparent px-2 py-1 text-[11px] text-neutral-200 hover:bg-neutral-800"
                  >
                    <span>Discard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveDrawing()}
                    disabled={isSavingDrawing}
                    className="inline-flex items-center gap-1 rounded-xl bg-[hsl(270.7_91%_65.1%)] px-3 py-1 text-[11px] text-white hover:bg-[hsl(270.7_91%_60%)] disabled:opacity-60 disabled:hover:bg-[hsl(270.7_91%_65.1%)]"
                  >
                    <span>{isSavingDrawing ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {drawMode && (
            <div className="pointer-events-auto absolute inset-x-0 bottom-4 z-30 flex justify-center">
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-900/95 px-4 py-2 text-[11px] text-neutral-50 shadow-xl">
                <div className="flex items-center gap-1">
                  {[{
                    id: "raspberry",
                    label: "Raspberry",
                    color: "hsl(270.7 91% 65.1%)",
                  },
                  {
                    id: "sky",
                    label: "Sky",
                    color: "hsl(199 89% 48%)",
                  },
                  {
                    id: "lime",
                    label: "Lime",
                    color: "hsl(83 80% 50%)",
                  },
                  {
                    id: "sun",
                    label: "Sun",
                    color: "hsl(45 97% 56%)",
                  }].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDrawColor(c.color)}
                      className={cn(
                        "h-5 w-5 rounded-xl border-2 border-transparent transition-colors",
                        drawColor === c.color && "border-white"
                      )}
                      style={{ backgroundColor: c.color }}
                      aria-label={c.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Brush</span>
                  {[2, 4, 6].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBrushSize(size)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-xl border border-transparent text-neutral-400 hover:border-neutral-700",
                        brushSize === size &&
                          "border-[hsl(270.7_91%_65.1%)] text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "block rounded-xl",
                          size === 2 && "h-1 w-1",
                          size === 4 && "h-1.5 w-1.5",
                          size === 6 && "h-2 w-2"
                        )}
                        style={{ backgroundColor: drawColor }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full",
              drawMode && "pointer-events-auto cursor-crosshair"
            )}
            onMouseDown={handleDrawPointerDown}
            onMouseMove={handleDrawPointerMove}
            onMouseUp={handleDrawPointerUp}
            onMouseLeave={handleDrawPointerUp}
          />

          {versionList.length > 1 && !drawMode && (
            <div className="pointer-events-auto absolute inset-x-0 bottom-4 z-20 flex justify-center">
              <div className="flex items-center gap-1 rounded-xl bg-neutral-900/90 px-3 py-1.5 text-[11px] text-neutral-50 shadow-lg">
                {versionList.map((v, index) => {
                  const label = v.label
                    ? v.label
                    : v.isOriginal
                    ? "Original"
                    : `Version ${index}`;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVersionIndex(index)}
                      className={cn(
                        "rounded-xl px-2 py-0.5 text-[11px] text-neutral-200 hover:bg-neutral-800",
                        index === activeVersionIndex &&
                          "bg-[hsl(270.7_91%_65.1%)] text-white"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <AnimatePresence>
            {commentMode && showHint && !draftPosition && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2"
              >
                <div className="rounded-xl bg-neutral-900/90 px-4 py-2 text-[11px] text-neutral-50 shadow-lg">
                  Click anywhere on the image to add a comment
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {commentMode && draftPosition && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                className="absolute z-30"
                style={{
                  left: `${draftPosition.x}%`,
                  top: `${draftPosition.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={(e) => {
                  // Verhindert, dass Klicks im Overlay das Bild-Click-Handler auslösen
                  e.stopPropagation();
                }}
              >
                <div className="mb-1 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-xl border-2 border-background bg-[var(--accent-primary)] shadow" />
                </div>
                <div className="relative rounded-2xl bg-neutral-900/95 px-3 py-2 text-[11px] text-neutral-50 shadow-xl">
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-xl p-0.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-50"
                    onClick={handleExitCommentMode}
                    aria-label="Close comment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="mb-1 font-medium">Add comment…</p>
                  <Textarea
                    autoFocus
                    rows={2}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="mt-1 min-h-[40px] resize-none border-none bg-neutral-800/80 px-2 py-1 text-[11px] text-neutral-50 shadow-inner focus-visible:ring-0"
                    placeholder="Type your comment…"
                  />
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-neutral-300 hover:bg-neutral-800"
                      onClick={handleExitCommentMode}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 rounded-xl bg-[var(--accent-primary)]/100 px-3 text-[11px] text-white hover:bg-[var(--accent-primary)]"
                      onClick={handleExitCommentMode}
                      disabled={!draftText.trim()}
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
