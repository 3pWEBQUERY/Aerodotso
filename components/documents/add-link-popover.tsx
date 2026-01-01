"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Link2, Check, Search, Plus, Loader2, ExternalLink, Play } from "lucide-react";
import { detectPlatform } from "@/lib/social/platform-detector";

const EMPTY_IDS: string[] = [];

interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  link_type?: string;
}

interface LinkPreview {
  title: string;
  description: string;
  image: string | null;
  url: string;
  domain: string;
}

interface AddLinkPopoverProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onAddLinks: (links: LinkItem[]) => void;
  excludeIds?: string[];
}

// Get badge info for link type
function getLinkTypeBadge(linkType?: string): { label: string; color: string } {
  switch (linkType) {
    case "youtube": return { label: "YouTube", color: "bg-red-600" };
    case "vimeo": return { label: "Vimeo", color: "bg-blue-500" };
    case "twitch": return { label: "Twitch", color: "bg-purple-600" };
    case "tiktok": return { label: "TikTok", color: "bg-black" };
    case "video": return { label: "Video", color: "bg-orange-500" };
    case "twitter": return { label: "X", color: "bg-black" };
    case "instagram": return { label: "Instagram", color: "bg-pink-500" };
    case "facebook": return { label: "Facebook", color: "bg-blue-600" };
    case "linkedin": return { label: "LinkedIn", color: "bg-blue-700" };
    case "reddit": return { label: "Reddit", color: "bg-orange-600" };
    case "spotify": return { label: "Spotify", color: "bg-green-600" };
    case "github": return { label: "GitHub", color: "bg-gray-800" };
    case "figma": return { label: "Figma", color: "bg-purple-500" };
    case "notion": return { label: "Notion", color: "bg-gray-900" };
    case "article": return { label: "Article", color: "bg-[var(--accent-primary)]" };
    default: return { label: "Website", color: "bg-gray-600" };
  }
}

// Check if URL is video type
function isVideoType(linkType?: string): boolean {
  return linkType === "youtube" || linkType === "vimeo" || linkType === "twitch" || linkType === "tiktok" || linkType === "video";
}

// Link picker card
function LinkPickerCard({
  link,
  isSelected,
  onToggle,
}: {
  link: LinkItem;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const badge = getLinkTypeBadge(link.link_type);
  const isVideo = isVideoType(link.link_type);

  return (
    <div
      className={`cursor-pointer relative group ${isVideo ? "w-72" : "w-40"}`}
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

      {/* Badge */}
      <div className={`absolute top-3 right-3 z-10 px-2 py-0.5 ${badge.color} rounded text-[10px] font-medium text-white`}>
        {badge.label}
      </div>

      {/* Card container */}
      <div
        className={`${isVideo ? "w-72 h-44" : "w-40 h-56"} rounded-2xl overflow-hidden bg-gray-900 relative ${
          isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
        }`}
      >
        {link.thumbnail_url ? (
          <img
            src={link.thumbnail_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <Link2 className="h-8 w-8 text-white/50" />
          </div>
        )}

        {/* Bottom gradient with title */}
        <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent ${isVideo ? "pt-10 pb-3 px-3" : "pt-8 pb-2.5 px-2.5"}`}>
          <div className="flex items-center gap-1.5">
            {isVideo ? (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="h-2.5 w-2.5 text-white fill-white ml-0.5" />
              </div>
            ) : (
              <Link2 className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
            )}
            <span className={`${isVideo ? "text-sm" : "text-xs"} text-white font-medium truncate`}>
              {link.title || "Untitled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddLinkPopover({
  workspaceId,
  isOpen,
  onClose,
  onAddLinks,
  excludeIds = EMPTY_IDS,
}: AddLinkPopoverProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
  
  // New link state
  const [linkInput, setLinkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!workspaceId || !isOpen) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/links?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.links) {
        const filteredLinks = data.links.filter(
          (link: LinkItem) => !excludeIds.includes(link.id)
        );
        setLinks(filteredLinks);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isOpen, excludeIds]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set());
      setSearchQuery("");
      setLinkInput("");
      setPreview(null);
      setActiveTab("existing");
    }
  }, [isOpen]);

  // Fetch preview when URL changes (debounced)
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    const trimmed = linkInput.trim();
    if (!trimmed || trimmed.length < 5) {
      setPreview(null);
      return;
    }

    const urlPattern = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i;
    if (!urlPattern.test(trimmed)) {
      setPreview(null);
      return;
    }

    setIsLoadingPreview(true);
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/links/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await response.json();
        if (data.title) {
          setPreview(data);
        }
      } catch (error) {
        console.error("Failed to fetch preview:", error);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [linkInput]);

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

  const handleAddExisting = () => {
    if (selectedIds.size > 0) {
      const selectedLinks = links.filter((l) => selectedIds.has(l.id));
      onAddLinks(selectedLinks);
      onClose();
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Create new link and add to canvas
  const handleCreateAndAdd = async () => {
    if (!linkInput.trim() || isSubmitting) return;
    
    let url = linkInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const detected = detectPlatform(url);
    const linkType = detected?.platform || undefined;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          url: preview?.url || url,
          title: preview?.title || getDomain(url),
          description: preview?.description || null,
          thumbnail_url: preview?.image || null,
          link_type: linkType,
        }),
      });
      
      if (response.ok) {
        const { link } = await response.json();
        // Add to canvas immediately
        onAddLinks([link]);
        onClose();
      }
    } catch (error) {
      console.error("Failed to create link:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLinks = links.filter((link) =>
    link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-[1100px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Add Link</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5">
          <button
            type="button"
            onClick={() => setActiveTab("existing")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "existing"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary-light)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            From Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "new"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary-light)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Plus className="h-4 w-4 inline mr-1" />
            New Link
          </button>
        </div>

        {/* Content */}
        {activeTab === "existing" ? (
          <>
            {/* Search */}
            <div className="px-5 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Links Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Link2 className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-muted-foreground text-sm">No links found</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="mt-3 text-sm text-[var(--accent-primary-light)] hover:underline"
                  >
                    Create a new link
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {filteredLinks.map((link) => (
                    <LinkPickerCard
                      key={link.id}
                      link={link}
                      isSelected={selectedIds.has(link.id)}
                      onToggle={() => toggleSelection(link.id)}
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
                  onClick={handleAddExisting}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* New Link Form */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <input
                    ref={linkInputRef}
                    type="text"
                    placeholder="Paste link here..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isLoadingPreview && handleCreateAndAdd()}
                    className="w-full pl-10 pr-10 py-3 border-2 border-[var(--accent-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                    autoFocus
                  />
                  {linkInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setLinkInput("");
                        setPreview(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>

                {/* Preview */}
                {isLoadingPreview && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading preview...</span>
                  </div>
                )}

                {preview && !isLoadingPreview && (
                  <div className="flex gap-3 p-3 border rounded-lg bg-gray-50">
                    {preview.image && (
                      <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-200">
                        <img 
                          src={preview.image} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                        {preview.title}
                      </h4>
                      {preview.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {preview.description}
                        </p>
                      )}
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        {preview.url}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Link will be saved to workspace and added to canvas
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAndAdd}
                disabled={!linkInput.trim() || isSubmitting || isLoadingPreview}
                className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Add to Canvas
                    <span className="text-xs opacity-70">↵</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
