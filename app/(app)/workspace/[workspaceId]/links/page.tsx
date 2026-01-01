"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link2, Trash2, Plus, X, Loader2, FolderClosed, Sparkles, Zap, Brain, FileText, Clock, Tag } from "lucide-react";
import { isValidUrl, isSocialMediaUrl, detectPlatform } from "@/lib/social/platform-detector";
import { useUpload } from "@/components/providers/upload-provider";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { AnimatedFolder } from "@/components/workspace/animated-folder";
import { LinkCard } from "@/components/workspace/link-card";
import { LinkCardList } from "@/components/workspace/link-card-list";
import { LinkCardCompact } from "@/components/workspace/link-card-compact";
import { DraggableItem } from "@/components/workspace/draggable-item";
import { DroppableFolder } from "@/components/workspace/droppable-folder";
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
  folder_id?: string | null;
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
    case "article": return { label: "Article", color: "bg-[var(--accent-primary)]" };
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<"flash" | "pro">("flash");
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const linkInputRef = useRef<HTMLInputElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addLinkProcessing } = useUpload();

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
      setAnalysis(null);
      setIsAnalyzing(false);
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
          // Auto-analyze with Gemini if enabled
          if (autoAnalyze) {
            analyzeLink(trimmed, data.title, data.description);
          }
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

  // Analyze link with Gemini
  const analyzeLink = async (url: string, title?: string, description?: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/links/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          title: title || url,
          description,
          model: selectedModel 
        }),
      });
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Failed to analyze link:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Check if URL is YouTube
  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
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
        setAnalysis(null);
        setDialogOpen(false);
        
        // Auto-process YouTube videos with progress tracking
        const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
        if (isYouTube && link?.id) {
          // Fire the processing with progress tracking (don't await - fire and forget)
          addLinkProcessing(link.id, link.title || url, url).catch(err => {
            console.error("Video processing failed:", err);
          });
        }
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

  // Search results state
  const [searchResults, setSearchResults] = useState<LinkItem[] | null>(null);

  // AI Search - auto-trigger with debounce
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || !workspaceId) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          workspaceId,
          searchTypes: ["semantic", "text"],
          limit: 50,
        }),
      });
      
      const data = await res.json();
      if (data.results) {
        // Filter only links from results
        const linkResults: LinkItem[] = data.results
          .filter((r: any) => r.result_type === "link")
          .map((r: any) => ({
            id: r.document_id,
            url: r.url || "",
            title: r.title,
            description: r.description,
            thumbnail_url: r.thumbnail_url || r.thumbnailUrl,
            link_type: r.link_type,
            created_at: r.created_at || new Date().toISOString(),
          }));
        setSearchResults(linkResults);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [workspaceId]);

  // Auto-search with debounce when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  // Use search results if available, otherwise filter locally
  const filteredLinks = searchResults !== null 
    ? searchResults.filter(link => !link.folder_id)
    : sortedLinks.filter(link =>
        !link.folder_id && (
          link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

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

  // Handle drag-and-drop to folder
  const handleDropToFolder = async (folderId: string, itemId: string, itemType: string) => {
    if (itemType !== "link") return;
    try {
      await fetch(`/api/links/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setLinks(prev => prev.map(l => 
        l.id === itemId ? { ...l, folder_id: folderId } : l
      ));
    } catch (error) {
      console.error("Failed to move link to folder:", error);
    }
  };

  return (
    <>
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Page Toolbar */}
        <PageToolbar
          pageType="links"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={() => handleSearch(searchQuery)}
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
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)]"
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
        ) : filteredLinks.length === 0 && folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-muted-foreground">No links found for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === "grid" && (
              <div className="flex flex-wrap gap-4 items-start">
                {/* Folders first - droppable */}
                {folders.map((folder) => {
                  const folderLinks = links.filter((l: any) => l.folder_id === folder.id);
                  return (
                    <DroppableFolder
                      key={`folder-${folder.id}`}
                      folderId={folder.id}
                      folderName={folder.name}
                      workspaceId={workspaceId || ""}
                      fileCount={folderLinks.length}
                      previewFiles={folderLinks.slice(0, 3).map((l: any) => ({ 
                        type: "link", 
                        name: l.title, 
                        previewUrl: l.thumbnail_url 
                      }))}
                      onDrop={handleDropToFolder}
                      acceptTypes={["link"]}
                    />
                  );
                })}
                {/* Links - draggable */}
                {filteredLinks.map((link) => (
                  <DraggableItem key={link.id} itemId={link.id} itemType="link">
                    <LinkCard
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
                  </DraggableItem>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filteredLinks.map((link) => (
                  <LinkCardList
                    key={link.id}
                    link={link}
                    workspaceId={workspaceId || ""}
                    isSelected={selectedLinks.has(link.id)}
                    onSelect={() => toggleLinkSelection(link.id, {} as React.MouseEvent)}
                  />
                ))}
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === "compact" && (
              <div className="space-y-0">
                {filteredLinks.map((link, i) => (
                  <div key={link.id} className={i > 0 ? "mt-1" : ""}>
                    <LinkCardCompact
                      link={link}
                      workspaceId={workspaceId || ""}
                      isSelected={selectedLinks.has(link.id)}
                      onSelect={() => toggleLinkSelection(link.id, {} as React.MouseEvent)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Paste Link Dialog - Enhanced with Gemini Analysis */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[var(--accent-primary)]" />
              Link hinzufügen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-hidden">
            {/* URL Input */}
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <input
                ref={linkInputRef}
                type="text"
                placeholder="Link einfügen..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoadingPreview && handlePasteLink()}
                className="w-full pl-10 pr-10 py-3 border-2 border-[var(--accent-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 overflow-hidden text-ellipsis"
              />
              {linkInput && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkInput("");
                    setPreview(null);
                    setAnalysis(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Model Selector */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">KI-Analyse</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoAnalyze}
                    onChange={(e) => setAutoAnalyze(e.target.checked)}
                    className="rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                  />
                  Auto
                </label>
                <div className="flex bg-white rounded-lg p-0.5 border">
                  <button
                    type="button"
                    onClick={() => setSelectedModel("flash")}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-all ${
                      selectedModel === "flash" 
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Zap className="h-3 w-3" />
                    Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModel("pro")}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-all ${
                      selectedModel === "pro" 
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Brain className="h-3 w-3" />
                    Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            {isLoadingPreview && (
              <div className="flex items-center gap-3 p-4 border rounded-xl bg-gray-50">
                <Loader2 className="h-5 w-5 text-[var(--accent-primary)] animate-spin" />
                <span className="text-sm text-muted-foreground">Lade Vorschau...</span>
              </div>
            )}

            {preview && !isLoadingPreview && (
              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex gap-4 p-4">
                  {preview.image && (
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
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
                    <h4 className="text-base font-semibold text-gray-900 line-clamp-2">
                      {preview.title}
                    </h4>
                    {preview.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {preview.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-2 truncate flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      {preview.domain || preview.url}
                    </p>
                  </div>
                </div>

                {/* Gemini Analysis Section */}
                {(isAnalyzing || analysis) && (
                  <div className="border-t bg-gradient-to-br from-gray-50 to-purple-50/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1 rounded-md ${selectedModel === "pro" ? "bg-purple-100" : "bg-yellow-100"}`}>
                        {selectedModel === "pro" ? (
                          <Brain className="h-3.5 w-3.5 text-purple-600" />
                        ) : (
                          <Zap className="h-3.5 w-3.5 text-yellow-600" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Gemini {selectedModel === "pro" ? "3 Pro" : "3 Flash"} Analyse
                      </span>
                      {isAnalyzing && (
                        <Loader2 className="h-3 w-3 animate-spin text-purple-500 ml-auto" />
                      )}
                    </div>

                    {isAnalyzing && !analysis && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span>Analysiere Inhalt...</span>
                      </div>
                    )}

                    {analysis && (
                      <div className="space-y-3">
                        {/* Summary */}
                        {analysis.summary && (
                          <div className="flex gap-2">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{analysis.summary}</p>
                          </div>
                        )}

                        {/* Key Topics */}
                        {analysis.keyTopics && analysis.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.keyTopics.map((topic: string, i: number) => (
                              <span 
                                key={i} 
                                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Tags and Meta */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {analysis.contentType && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {analysis.contentType}
                            </span>
                          )}
                          {analysis.estimatedReadTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {analysis.estimatedReadTime}
                            </span>
                          )}
                          {analysis.language && (
                            <span className="uppercase font-medium">{analysis.language}</span>
                          )}
                        </div>

                        {/* Tags */}
                        {analysis.tags && analysis.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.tags.slice(0, 8).map((tag: string, i: number) => (
                              <span 
                                key={i} 
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Analyze Button (if auto is off) */}
            {preview && !autoAnalyze && !analysis && !isAnalyzing && (
              <button
                type="button"
                onClick={() => analyzeLink(linkInput, preview.title, preview.description)}
                className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Mit Gemini {selectedModel === "pro" ? "3 Pro" : "3 Flash"} analysieren
              </button>
            )}

            <p className="text-xs text-muted-foreground">
              Link wird im Workspace gespeichert{isYouTubeUrl(linkInput) ? " • YouTube Videos werden automatisch transkribiert" : ""}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handlePasteLink}
              disabled={!linkInput.trim() || isSubmitting || isLoadingPreview}
              className="px-5 py-2 text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Speichern
                  <span className="text-xs opacity-70 ml-1">↵</span>
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
