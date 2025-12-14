"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link2, Trash2, Plus, X, Loader2, FolderClosed } from "lucide-react";
import { isValidUrl, isSocialMediaUrl, detectPlatform } from "@/lib/social/platform-detector";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { AnimatedFolder } from "@/components/workspace/animated-folder";
import { LinkCard } from "@/components/workspace/link-card";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  link_type?: string;
  created_at: string;
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
    case "instagram": return { label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500" };
    case "facebook": return { label: "Facebook", color: "bg-blue-600" };
    case "linkedin": return { label: "LinkedIn", color: "bg-blue-700" };
    case "reddit": return { label: "Reddit", color: "bg-orange-600" };
    case "pinterest": return { label: "Pinterest", color: "bg-red-700" };
    case "spotify": return { label: "Spotify", color: "bg-green-600" };
    case "soundcloud": return { label: "SoundCloud", color: "bg-orange-500" };
    case "apple_music": return { label: "Apple Music", color: "bg-pink-500" };
    case "github": return { label: "GitHub", color: "bg-gray-800" };
    case "gitlab": return { label: "GitLab", color: "bg-orange-600" };
    case "figma": return { label: "Figma", color: "bg-purple-500" };
    case "notion": return { label: "Notion", color: "bg-gray-900" };
    case "google_doc": return { label: "Google Doc", color: "bg-blue-500" };
    case "article": return { label: "Article", color: "bg-emerald-600" };
    case "pdf": return { label: "PDF", color: "bg-red-500" };
    case "image": return { label: "Image", color: "bg-indigo-500" };
    case "audio": return { label: "Audio", color: "bg-violet-500" };
    case "document": return { label: "Document", color: "bg-blue-500" };
    default: return { label: "Website", color: "bg-gray-600" };
  }
}

interface LinkPreview {
  title: string;
  description: string;
  image: string | null;
  url: string;
  domain: string;
}

// Empty state with hover effect
function EmptyState({ onPasteLink }: { onPasteLink: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <button
        type="button"
        onClick={onPasteLink}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative mb-4 focus:outline-none"
      >
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
          ${isHovered ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-100"}
        `}>
          <Link2 className={`
            h-7 w-7 transition-colors duration-200
            ${isHovered ? "text-blue-600" : "text-gray-400"}
          `} />
        </div>
        {isHovered && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <Plus className="h-3 w-3 text-blue-600" />
          </div>
        )}
      </button>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {isHovered ? "Paste Link" : "No links"}
      </h2>
      <p className="text-sm text-gray-500">Save a link you want to remember.</p>
    </div>
  );
}

export default function WorkspaceLinksPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [folders, setFolders] = useState<{ id: string; name: string; type?: string }[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const linkInputRef = useRef<HTMLInputElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [linksRes, foldersRes] = await Promise.all([
        fetch(`/api/links?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}&type=links`)
      ]);
      const linksData = await linksRes.json();
      const foldersData = await foldersRes.json();
      if (linksData.links) setLinks(linksData.links);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Focus input when dialog opens
  useEffect(() => {
    if (dialogOpen && linkInputRef.current) {
      setTimeout(() => linkInputRef.current?.focus(), 100);
    }
    // Reset preview when dialog closes
    if (!dialogOpen) {
      setPreview(null);
      setLinkInput("");
    }
  }, [dialogOpen]);

  // Handle global paste event (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // Don't handle paste if user is typing in an input or dialog is already open
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const text = event.clipboardData?.getData('text/plain')?.trim();
      if (!text) return;

      // Check if it's a valid URL
      if (!isValidUrl(text)) return;

      // Prevent default paste behavior
      event.preventDefault();

      // Open dialog and set the pasted URL
      setLinkInput(text);
      setDialogOpen(true);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Fetch preview when URL changes (debounced)
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Check if input looks like a URL
    const trimmed = linkInput.trim();
    if (!trimmed || trimmed.length < 5) {
      setPreview(null);
      return;
    }

    // Simple URL validation
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
    }, 500); // 500ms debounce

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [linkInput]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Handle paste link
  const handlePasteLink = async () => {
    if (!linkInput.trim() || isSubmitting) return;
    
    // Validate URL
    let url = linkInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Detect platform for social media URLs
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
        setLinks(prev => [link, ...prev]);
        setLinkInput("");
        setPreview(null);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to create link:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle folder created from toolbar
  const handleFolderCreated = (folder: { id: string; name: string }) => {
    setFolders(prev => [...prev, { ...folder, type: "links" }]);
  };

  // Sort and filter links
  const sortedLinks = [...links].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date_added") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "name") cmp = (a.title || "").localeCompare(b.title || "");
    return sortAsc ? -cmp : cmp;
  });

  const filteredLinks = sortedLinks.filter(link =>
    link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search (for AI search in future)
  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Selection handlers
  const toggleLinkSelection = (linkId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLinks(prev => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  };

  const clearSelection = () => setSelectedLinks(new Set());

  // Delete selected links
  const deleteSelected = async () => {
    const ids = Array.from(selectedLinks);
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/links/${id}`, { method: "DELETE" })
      ));
      setLinks(prev => prev.filter(l => !ids.includes(l.id)));
      clearSelection();
    } catch (error) {
      console.error("Failed to delete links:", error);
    }
  };

  // Check if URL is a video (YouTube, Vimeo, etc.)
  const isVideoUrl = (url: string) => {
    return url.includes("youtube.com") || 
           url.includes("youtu.be") || 
           url.includes("vimeo.com") ||
           url.includes("twitch.tv");
  };

  return (
    <>
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Page Toolbar */}
        <PageToolbar
          pageType="links"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={handleSearch}
          isSearching={isSearching}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortAsc={sortAsc}
          onSortAscChange={setSortAsc}
          sortOptions={["date_added", "name"]}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          workspaceId={workspaceId || ""}
          folders={folders}
          onFolderCreated={handleFolderCreated}
          folderType="links"
          primaryAction={
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Paste Link
            </button>
          }
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : links.length === 0 ? (
          <EmptyState onPasteLink={() => setDialogOpen(true)} />
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-muted-foreground">No links found for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 items-start">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.id}
                id={link.id}
                url={link.url}
                title={link.title}
                thumbnailUrl={link.thumbnail_url}
                linkType={link.link_type}
                isSelected={selectedLinks.has(link.id)}
                onCheckboxClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleLinkSelection(link.id, e);
                }}
                workspaceId={workspaceId || ""}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paste Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Paste a link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-hidden">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <input
                ref={linkInputRef}
                type="text"
                placeholder="Link goes here..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoadingPreview && handlePasteLink()}
                className="w-full pl-10 pr-10 py-3 border-2 border-emerald-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 overflow-hidden text-ellipsis"
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

            {/* Preview Card */}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
              Link will be saved to the workspace root
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePasteLink}
              disabled={!linkInput.trim() || isSubmitting || isLoadingPreview}
              className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Capture
                  <span className="text-xs opacity-70">↵</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selection Action Bar */}
      {selectedLinks.size > 0 && (
        <SelectionActionBar
          selectedCount={selectedLinks.size}
          onClear={clearSelection}
          onDelete={deleteSelected}
        />
      )}
    </>
  );
}
