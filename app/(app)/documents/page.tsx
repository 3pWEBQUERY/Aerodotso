 "use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FileText,
  ImageIcon,
  CheckCircle2,
  Circle,
  Folder,
  Star,
  Share2,
  Trash2,
  X,
  LayoutGrid,
  List,
  Upload,
} from "lucide-react";
import { useUpload } from "@/components/providers/upload-provider";

interface DocumentsPageProps {
  workspaceId?: string;
}

export default function DocumentsPage({ workspaceId }: DocumentsPageProps) {
  const { addUpload } = useUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [autoUploadNextSelection, setAutoUploadNextSelection] = useState(false);
  const [sortBy, setSortBy] = useState<
    "date_added" | "last_modified" | "name" | "type"
  >("date_added");
  const [viewMode, setViewMode] = useState<
    "grid" | "listWithPreview" | "list"
  >("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const loadFiles = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const url = workspaceId 
        ? `/api/documents/list?workspaceId=${workspaceId}`
        : "/api/documents/list";
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Laden der Dokumente.");
      }

      setFiles(Array.isArray(data.documents) ? data.documents : []);
    } catch (err: any) {
      setMessage(err.message ?? "Fehler beim Laden der Dokumente.");
    } finally {
      setIsLoadingList(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const uploadSelectedFile = async (selected: File) => {
    setMessage(null);

    try {
      await addUpload(selected, workspaceId || "");
      setMessage("Upload erfolgreich.");
      await loadFiles();
    } catch (err: any) {
      setMessage(err.message ?? "Fehler beim Upload.");
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const isStarred = (id: string) => starredIds.includes(id);

  const handleStarSelected = () => {
    if (selectedIds.length === 0) return;
    setStarredIds((prev) => {
      const set = new Set(prev);
      selectedIds.forEach((id) => {
        if (set.has(id)) set.delete(id);
        else set.add(id);
      });
      return Array.from(set);
    });
  };

  const handleMoveSelected = () => {
    // TODO: echte Move-Logik (z.B. Ordner) implementieren
  };

  const handleShareSelected = () => {
    // TODO: Share-Logik implementieren
  };

  const handleDeleteSelected = () => {
    // TODO: Delete-Logik implementieren
  };

  const getTimestamp = (doc: any, mode: "created" | "updated") => {
    const raw =
      mode === "created" ? doc?.created_at : doc?.updated_at ?? doc?.created_at;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const formatDate = (value: any) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("de-DE");
  };

  const sortedFiles = [...files];
  sortedFiles.sort((a: any, b: any) => {
    switch (sortBy) {
      case "name": {
        const an = (a?.title ?? "").toLocaleLowerCase();
        const bn = (b?.title ?? "").toLocaleLowerCase();
        return an.localeCompare(bn);
      }
      case "type": {
        const at = (a?.mime_type ?? "").toLocaleLowerCase();
        const bt = (b?.mime_type ?? "").toLocaleLowerCase();
        return at.localeCompare(bt);
      }
      case "last_modified": {
        const aTime = getTimestamp(a, "updated");
        const bTime = getTimestamp(b, "updated");
        // Älteste zuerst, damit sich die Sortierung klar von "Date added" unterscheidet
        return aTime - bTime;
      }
      case "date_added":
      default: {
        const aTime = getTimestamp(a, "created");
        const bTime = getTimestamp(b, "created");
        return bTime - aTime;
      }
    }
  });

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredFiles =
    normalizedQuery.length === 0
      ? sortedFiles
      : sortedFiles.filter((doc: any) => {
          const title = (doc?.title ?? "").toLocaleLowerCase();
          const mime = (doc?.mime_type ?? "").toLocaleLowerCase();
          return (
            title.includes(normalizedQuery) || mime.includes(normalizedQuery)
          );
        });

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-sm shadow-sm">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
          >
            <span className="text-[11px]">Media</span>
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Verstecktes File-Input für den Toolbar-Upload-Button */}
      <input
        id="file"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.txt"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0] ?? null;

          if (f && autoUploadNextSelection && !isUploading) {
            setAutoUploadNextSelection(false);
            await uploadSelectedFile(f);
          }
        }}
      />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed left-1/2 top-20 z-30 -translate-x-1/2"
          >
            <div className="flex items-center gap-4 rounded-xl border bg-background/95 px-4 py-2 text-xs shadow-lg">
              <span className="font-medium">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={handleMoveSelected}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Folder className="h-3 w-3" />
                <span>Move</span>
              </button>
              <button
                type="button"
                onClick={handleStarSelected}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Star className="h-3 w-3" />
                <span>Star</span>
              </button>
              <button
                type="button"
                onClick={handleShareSelected}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-3 w-3" />
                <span>Share</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-xl hover:bg-muted"
                aria-label="Selektion aufheben"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(
                  value as "date_added" | "last_modified" | "name" | "type"
                )
              }
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="date_added">Date added</SelectItem>
                <SelectItem value="last_modified">Last modified</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              {filteredFiles.length} Dateien
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-muted px-1 py-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-background",
                  viewMode === "grid" &&
                    "bg-background text-foreground shadow-sm"
                )}
                aria-label="Grid-Ansicht"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("listWithPreview")}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-background",
                  viewMode === "listWithPreview" &&
                    "bg-background text-foreground shadow-sm"
                )}
                aria-label="Listenansicht mit Vorschau"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-xl text-muted-foreground hover:bg-background",
                  viewMode === "list" &&
                    "bg-background text-foreground shadow-sm"
                )}
                aria-label="Kompakte Listenansicht"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-xl px-3 bg-[hsl(270.7_91%_65.1%)] text-white hover:bg-[hsl(270.7_91%_60%)]"
              onClick={() => {
                setAutoUploadNextSelection(true);
                const input = document.getElementById(
                  "file"
                ) as HTMLInputElement | null;
                input?.click();
              }}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        </div>
        {isLoadingList ? (
          <p className="text-xs text-muted-foreground">Lade Dokumente...</p>
        ) : filteredFiles.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {files.length === 0
              ? "Noch keine Dokumente vorhanden. Lade oben deine ersten Dateien hoch."
              : "Keine Treffer für deine Suche."}
          </p>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
            {filteredFiles.map((f: any) => {
              const isImage =
                typeof f.mime_type === "string" &&
                f.mime_type.startsWith("image/");

              const selected = isSelected(f.id);

              return (
                <Link
                  key={f.id ?? f.storage_path ?? f.title}
                  href={`/documents/${f.id}`}
                  className="group"
                >
                  <Card
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden rounded-2xl border bg-card/90 shadow-sm transition-shadow group-hover:shadow-lg",
                      selected && "border-[hsl(270.7_91%_65.1%)]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSelected(f.id);
                      }}
                      className={cn(
                        "absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-xl border border-white/70 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100",
                        selected &&
                          "bg-[hsl(270.7_91%_65.1%)] border-[hsl(270.7_91%_65.1%)] text-white opacity-100"
                      )}
                    >
                      {selected ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </button>

                    {isStarred(f.id) && (
                      <div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-xl bg-black/60 text-yellow-400">
                        <Star className="h-3 w-3" />
                      </div>
                    )}

                    {isImage && f.previewUrl ? (
                      <Image
                        src={f.previewUrl}
                        alt={f.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/60 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/80 border text-[10px]">
                          <FileText className="w-3 h-3" />
                          <span>Dokument</span>
                        </div>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] text-white">
                      {isImage ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : (
                        <FileText className="w-3 h-3" />
                      )}
                      <span className="truncate">{f.title}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : viewMode === "listWithPreview" ? (
          <div className="divide-y rounded-xl border bg-card/60">
            {sortedFiles.map((f: any) => {
              const isImage =
                typeof f.mime_type === "string" &&
                f.mime_type.startsWith("image/");
              const typeLabel =
                typeof f.mime_type === "string" ? f.mime_type : "Unbekannt";

              return (
                <Link
                  key={f.id ?? f.storage_path ?? f.title}
                  href={`/documents/${f.id}`}
                  className="group flex items-center gap-3 px-3 py-2 hover:bg-muted/60"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSelected(f.id);
                    }}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground",
                      isSelected(f.id) && "bg-foreground text-background"
                    )}
                  >
                    {isSelected(f.id) ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </button>

                  {isStarred(f.id) && (
                    <Star className="h-3 w-3 text-yellow-400" />
                  )}

                  {isImage && f.previewUrl ? (
                    <div className="relative h-12 w-9 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={f.previewUrl}
                        alt={f.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-9 items-center justify-center rounded-md bg-muted/70">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {f.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {typeLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                      <span>{formatDate(f.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-card/60">
            {sortedFiles.map((f: any) => {
              const typeLabel =
                typeof f.mime_type === "string" ? f.mime_type : "Unbekannt";

              return (
                <Link
                  key={f.id ?? f.storage_path ?? f.title}
                  href={`/documents/${f.id}`}
                  className="group flex items-center gap-3 px-3 py-2 hover:bg-muted/60"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSelected(f.id);
                    }}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground",
                      isSelected(f.id) && "bg-foreground text-background"
                    )}
                  >
                    {isSelected(f.id) ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </button>

                  {isStarred(f.id) && (
                    <Star className="h-3 w-3 text-yellow-400" />
                  )}

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {f.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {typeLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                      <span>{formatDate(f.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Zurück zum <Link href="/workspace" className="underline">Workspace</Link>.
      </p>
    </div>
  );
}
