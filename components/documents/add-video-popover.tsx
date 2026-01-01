"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Video, Check, Search, Film, Star } from "lucide-react";

const EMPTY_IDS: string[] = [];

type VideoOrientation = "portrait" | "landscape" | "square";

interface VideoDocument {
  id: string;
  title: string;
  mime_type: string;
  previewUrl?: string;
  file_size?: number;
}

interface AddVideoPopoverProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onAddVideos: (videos: VideoDocument[]) => void;
  excludeIds?: string[];
}

// Individual video card that detects its own orientation
function VideoPickerCard({
  doc,
  isSelected,
  onToggle,
}: {
  doc: VideoDocument;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [orientation, setOrientation] = useState<VideoOrientation>("landscape");

  // Detect video orientation
  useEffect(() => {
    if (!doc.previewUrl) return;
    
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const handleLoadedMetadata = () => {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      if (w > 0 && h > 0) {
        if (h > w * 1.2) {
          setOrientation("portrait");
        } else if (w > h * 1.2) {
          setOrientation("landscape");
        } else {
          setOrientation("square");
        }
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.src = doc.previewUrl;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.src = "";
    };
  }, [doc.previewUrl]);

  // Auto-play on hover
  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isHovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  const isPortrait = orientation === "portrait";

  return (
    <div
      className={`cursor-pointer relative group ${isPortrait ? "w-40" : "w-72"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onToggle}
    >
      {/* Selection checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100"
            : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check className="h-4 w-4" />}
      </button>

      {/* Video Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="px-2 py-1 rounded-xl bg-black/60 text-white text-[10px] font-medium backdrop-blur">
          Video
        </div>
      </div>

      {/* Video container */}
      <div
        className={`${isPortrait ? "w-40 h-56" : "w-72 h-44"} rounded-2xl overflow-hidden bg-gray-100 relative ${
          isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
        }`}
      >
        {doc.previewUrl ? (
          <video
            ref={videoRef}
            src={doc.previewUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <Video className="h-8 w-8 text-gray-600" />
          </div>
        )}

        {/* Bottom gradient with title */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isPortrait ? "p-2 pt-6" : "p-3 pt-8"}`}>
          <div className="flex items-center gap-1.5">
            <Film className={`${isPortrait ? "h-3.5 w-3.5" : "h-4 w-4"} flex-shrink-0 text-white/80`} />
            <span className={`${isPortrait ? "text-xs" : "text-sm"} text-white font-medium truncate`}>
              {doc.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddVideoPopover({
  workspaceId,
  isOpen,
  onClose,
  onAddVideos,
  excludeIds = EMPTY_IDS,
}: AddVideoPopoverProps) {
  const [documents, setDocuments] = useState<VideoDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!workspaceId || !isOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/list?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.documents) {
        // Filter to only show videos and exclude already added ones
        const videoDocs = data.documents.filter(
          (doc: VideoDocument) =>
            doc.mime_type?.startsWith("video/") && !excludeIds.includes(doc.id)
        );
        setDocuments(videoDocs);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isOpen, excludeIds]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    if (selectedIds.size > 0) {
      const selectedDocs = documents.filter((d) => selectedIds.has(d.id));
      onAddVideos(selectedDocs);
      onClose();
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-[1100px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Add Video from Workspace</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground text-sm">No videos found</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredDocuments.map((doc) => (
                <VideoPickerCard
                  key={doc.id}
                  doc={doc}
                  isSelected={selectedIds.has(doc.id)}
                  onToggle={() => toggleSelection(doc.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
