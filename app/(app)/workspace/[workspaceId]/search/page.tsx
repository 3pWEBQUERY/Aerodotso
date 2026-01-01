"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Search, 
  Trash2, 
  ImageIcon, 
  PanelRight, 
  Sparkles, 
  Clock, 
  Tag, 
  FileText, 
  Video, 
  Music, 
  File,
  X,
  Loader2,
  SlidersHorizontal,
  Upload,
  Camera,
  LayoutPanelLeft,
  TextAlignJustify,
  User,
  Star,
  Share2,
  ExternalLink,
  Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDocumentPanels, DocumentPanels } from "@/components/workspace/document-panels";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MediaCard } from "@/components/workspace/media-card";
import { VideoCard } from "@/components/workspace/video-card";
import { NoteCard } from "@/components/workspace/note-card";
import { LinkCard } from "@/components/workspace/link-card";
import { CanvasCard } from "@/components/canvas/canvas-card";
import { ScratchCard } from "@/components/workspace/scratch-card";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";

interface SearchResult {
  id?: string;
  document_id: string;
  title: string;
  mime_type?: string;
  storage_path?: string;
  thumbnail_path?: string;
  description?: string;
  tags?: string[];
  ai_summary?: string;
  similarity: number;
  search_type: string;
  result_type?: "document" | "note" | "scratch" | "link";
  frame_index?: number;
  timestamp_seconds?: number;
  match_context?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  url?: string;
  content?: string;
  created_at?: string;
}

interface RecentSearch {
  query: string;
  result_count: number;
  created_at: string;
}

export default function WorkspaceSearchPage() {
  const params = useParams<{ workspaceId: string }>();
  const searchParams = useSearchParams();
  const workspaceId = params?.workspaceId;
  
  const [query, setQuery] = useState("");
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTypes, setSearchTypes] = useState<string[]>(["semantic", "text", "visual"]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection state
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Image search state
  const [searchImage, setSearchImage] = useState<File | null>(null);
  const [searchImagePreview, setSearchImagePreview] = useState<string | null>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  
  const { openPanels, openInPanel, closePanel, handleMouseDown } = useDocumentPanels();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch recent searches and suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/search?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.recentSearches) setRecentSearches(data.recentSearches);
      if (data.suggestedTags) setSuggestedTags(data.suggestedTags);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Perform search
  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || !workspaceId) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          workspaceId,
          searchTypes,
          limit: 50,
        }),
      });
      
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        // Dispatch event to refresh sidebar search history
        window.dispatchEvent(new CustomEvent("search-history-updated"));
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [query, workspaceId, searchTypes]);

  // Handle URL query parameter for search
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && !initialQueryProcessed) {
      setQuery(urlQuery);
      setInitialQueryProcessed(true);
      // Execute search with URL query
      handleSearch(urlQuery);
    }
  }, [searchParams, initialQueryProcessed, handleSearch]);

  // Handle image upload for visual person search
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSearchImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSearchImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Perform visual/person search with uploaded image
  const handleImageSearch = useCallback(async () => {
    if (!searchImage || !workspaceId) return;

    setIsImageSearching(true);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const formData = new FormData();
      formData.append("image", searchImage);
      formData.append("workspaceId", workspaceId);
      if (query.trim()) {
        formData.append("query", query);
      }

      const res = await fetch("/api/search/visual", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        // Dispatch event to refresh sidebar search history
        window.dispatchEvent(new CustomEvent("search-history-updated"));
      }
    } catch (error) {
      console.error("Visual search failed:", error);
    } finally {
      setIsImageSearching(false);
      setIsSearching(false);
    }
  }, [searchImage, workspaceId, query]);

  // Clear search image
  const clearSearchImage = useCallback(() => {
    setSearchImage(null);
    setSearchImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Enter" && document.activeElement === inputRef.current) {
        handleSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSearch]);

  // Selection functions
  const toggleSelection = useCallback((resultId: string) => {
    setSelectedResults(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedResults(new Set());
  }, []);

  // Get selected results data
  const getSelectedResults = useCallback(() => {
    return results.filter(r => selectedResults.has(r.document_id));
  }, [results, selectedResults]);

  // Open selected items
  const openSelected = useCallback(() => {
    const selected = getSelectedResults();
    if (selected.length === 0) return;
    
    // Open first item in new tab, rest in panels if possible
    const first = selected[0];
    if (first.result_type === "note") {
      openInPanel(first.document_id);
    } else if (first.result_type === "scratch") {
      window.open(`/workspace/${workspaceId}/scretch/${first.document_id}`, "_blank");
    } else if (first.result_type === "link") {
      window.open(first.url || `/workspace/${workspaceId}/links`, "_blank");
    } else {
      window.open(`/workspace/${workspaceId}/document/${first.document_id}`, "_blank");
    }
    clearSelection();
  }, [getSelectedResults, openInPanel, workspaceId, clearSelection]);

  // Star selected items
  const starSelected = useCallback(async () => {
    const selected = getSelectedResults();
    const documentIds = selected
      .filter(r => r.result_type === "document" || !r.result_type)
      .map(r => r.document_id);
    
    if (documentIds.length === 0) {
      clearSelection();
      return;
    }
    
    try {
      await fetch("/api/documents/star", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds, starred: true }),
      });
      // Update local state to show starred
      setResults(prev => prev.map(r => 
        documentIds.includes(r.document_id) ? { ...r, is_starred: true } : r
      ));
    } catch (error) {
      console.error("Failed to star:", error);
    }
    clearSelection();
  }, [getSelectedResults, clearSelection]);

  // Get share URL for selected items
  const getShareUrl = useCallback(() => {
    const selected = getSelectedResults();
    if (selected.length === 0) return "";
    
    const first = selected[0];
    
    if (first.result_type === "note") {
      return `${window.location.origin}/workspace/${workspaceId}/notes/${first.document_id}`;
    } else if (first.result_type === "scratch") {
      return `${window.location.origin}/workspace/${workspaceId}/scretch/${first.document_id}`;
    } else if (first.result_type === "link") {
      return first.url || "";
    } else {
      return `${window.location.origin}/workspace/${workspaceId}/document/${first.document_id}`;
    }
  }, [getSelectedResults, workspaceId]);

  // Share handlers for different platforms
  const shareVia = useCallback((platform: string) => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(getSelectedResults()[0]?.title || "Check this out");
    
    let shareLink = "";
    
    switch (platform) {
      case "whatsapp":
        shareLink = `https://wa.me/?text=${title}%20${url}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${title}&body=${url}`;
        break;
      case "x":
        shareLink = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "telegram":
        shareLink = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
      case "copy":
        navigator.clipboard.writeText(getShareUrl());
        setShowShareMenu(false);
        clearSelection();
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
    clearSelection();
  }, [getShareUrl, getSelectedResults, clearSelection]);

  // Get icon for file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mimeType?.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (mimeType?.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Get search type badge
  const getSearchTypeBadge = (searchType: string) => {
    const badges: Record<string, { label: string; color: string; bg: string }> = {
      "visual_person": { label: "Person", color: "text-purple-700", bg: "bg-purple-100" },
      "visual": { label: "Visuell", color: "text-blue-700", bg: "bg-blue-100" },
      "semantic": { label: "AI", color: "text-[var(--accent-primary)]", bg: "bg-[var(--accent-primary)]/20" },
      "text": { label: "Text", color: "text-gray-700", bg: "bg-gray-100" },
      "transcript": { label: "Transkript", color: "text-orange-700", bg: "bg-orange-100" },
      "text_fallback": { label: "Text", color: "text-gray-700", bg: "bg-gray-100" },
    };
    
    const badge = badges[searchType] || { label: searchType, color: "text-gray-600", bg: "bg-gray-100" };
    
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.color} ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  // Format timestamp
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto">
        {/* Centered Container - vertically centered when no results */}
        <div className={cn(
          "flex flex-col px-6 py-8",
          !hasSearched || results.length === 0 
            ? "min-h-full items-center justify-center" 
            : "min-h-full"
        )}>
        {/* Search Header */}
        <div className={cn(
          "w-full max-w-3xl mx-auto",
          !hasSearched || results.length === 0 ? "" : "mb-8"
        )}>
          {/* Search Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Sparkles className="h-6 w-6 text-[var(--accent-primary-light)]" />
            </div>
            <h1 className="text-3xl font-medium mb-2">
              Find anything in your workspace
            </h1>
            <p className="text-muted-foreground">
              Search by description, content, or visual appearance
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (searchImage ? handleImageSearch() : handleSearch())}
                  placeholder={searchImage ? "Add description (optional)..." : "Search by description, color, or content..."}
                  className="w-full pl-12 pr-12 py-2 text-base border rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setHasSearched(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Image Upload Button */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={cn(
                  "p-2.5 border rounded-2xl bg-white shadow-sm hover:bg-muted transition-colors flex items-center justify-center",
                  searchImage ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : ""
                )}
                title="Bild hinzufügen für Personensuche"
              >
                <Camera className={cn("h-5 w-5", searchImage ? "text-[var(--accent-primary-light)]" : "text-muted-foreground")} />
              </button>
              
              {/* Search Button */}
              <button
                type="button"
                onClick={() => searchImage ? handleImageSearch() : handleSearch()}
                disabled={(!query.trim() && !searchImage) || isSearching}
                className="px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : searchImage ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {searchImage ? "Person suchen" : "Search"}
              </button>
            </div>
            
            {/* Image Preview */}
            {searchImagePreview && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={searchImagePreview} 
                    alt="Search image" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--accent-primary)]">Bild für Personensuche</p>
                  <p className="text-xs text-[var(--accent-primary-light)] truncate">{searchImage?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={clearSearchImage}
                  className="p-1.5 hover:bg-[var(--accent-primary)]/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-[var(--accent-primary-light)]" />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded-lg text-[10px] font-mono">/</kbd> to focus
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10/60 shadow-sm px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                      viewMode === "grid"
                        ? "bg-[var(--accent-primary)] text-white shadow-sm"
                        : "text-[var(--accent-primary)] hover:bg-white"
                    )}
                    aria-pressed={viewMode === "grid"}
                  >
                    <LayoutPanelLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all",
                      viewMode === "list"
                        ? "bg-[var(--accent-primary)] text-white shadow-sm"
                        : "text-[var(--accent-primary)] hover:bg-white"
                    )}
                    aria-pressed={viewMode === "list"}
                  >
                    <TextAlignJustify className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className={cn(
          "w-full max-w-5xl mx-auto",
          hasSearched || results.length > 0 ? "mt-8" : "mt-4"
        )}>
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary-light)] mb-4" />
                <p className="text-muted-foreground">Searching your Workspace...</p>
              </motion.div>
            ) : hasSearched && results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">No results found</p>
                <p className="text-muted-foreground text-sm">
                  Try different keywords or upload more content
                </p>
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {results.length} result{results.length !== 1 ? "s" : ""} found
                  </p>
                </div>

                {/* Grid View with Cards */}
                {viewMode === "grid" && (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {results.map((result, i) => {
                      const resultType = result.result_type;
                      const isImage = result.mime_type?.startsWith("image/");
                      const isVideo = result.mime_type?.startsWith("video/");
                      const thumbnailSrc = result.thumbnailUrl || result.previewUrl || result.thumbnail_url || result.thumbnail_path || "";
                      
                      // Note results
                      if (resultType === "note") {
                        return (
                          <motion.div
                            key={`note-${result.document_id}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="w-44"
                          >
                            <NoteCard
                              note={{
                                id: result.document_id,
                                title: result.title || "Untitled Note",
                                content: result.description || "",
                                created_at: result.created_at || new Date().toISOString(),
                              }}
                              isSelected={selectedResults.has(result.document_id)}
                              onSelect={() => toggleSelection(result.document_id)}
                              onClick={() => {}}
                              onOpenInPanel={() => openInPanel(result.document_id)}
                            />
                          </motion.div>
                        );
                      }
                      
                      // Scratch results
                      if (resultType === "scratch") {
                        return (
                          <motion.div
                            key={`scratch-${result.document_id}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="w-44"
                          >
                            <ScratchCard
                              scratch={{
                                id: result.document_id,
                                title: result.title || "Untitled Scratch",
                                data: {},
                                thumbnail: result.thumbnail_path || null,
                                created_at: result.created_at || new Date().toISOString(),
                              }}
                              isSelected={selectedResults.has(result.document_id)}
                              onSelect={() => toggleSelection(result.document_id)}
                              onClick={() => window.location.href = `/workspace/${workspaceId}/scretch/${result.document_id}`}
                            />
                          </motion.div>
                        );
                      }
                      
                      // Link results
                      if (resultType === "link") {
                        return (
                          <motion.div
                            key={`link-${result.document_id}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <LinkCard
                              id={result.document_id}
                              url={result.url || ""}
                              title={result.title}
                              thumbnailUrl={result.thumbnail_url}
                              isSelected={selectedResults.has(result.document_id)}
                              onCheckboxClick={() => toggleSelection(result.document_id)}
                              workspaceId={workspaceId || ""}
                            />
                          </motion.div>
                        );
                      }
                      
                      // MediaCard for images
                      if (isImage && thumbnailSrc) {
                        return (
                          <motion.div
                            key={`media-${result.document_id}-${result.frame_index || 0}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <MediaCard
                              src={thumbnailSrc}
                              alt={result.title}
                              title={result.title}
                              isSelected={selectedResults.has(result.document_id)}
                              isStarred={(result as any).is_starred || false}
                              onCheckboxClick={() => toggleSelection(result.document_id)}
                              href={`/workspace/${workspaceId}/document/${result.document_id}`}
                            />
                          </motion.div>
                        );
                      }
                      
                      // VideoCard for videos
                      if (isVideo && thumbnailSrc) {
                        return (
                          <motion.div
                            key={`video-${result.document_id}-${result.frame_index || 0}-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <VideoCard
                              src={thumbnailSrc}
                              alt={result.title}
                              title={result.title}
                              isSelected={selectedResults.has(result.document_id)}
                              isStarred={(result as any).is_starred || false}
                              onCheckboxClick={() => toggleSelection(result.document_id)}
                              href={`/workspace/${workspaceId}/document/${result.document_id}`}
                            />
                          </motion.div>
                        );
                      }
                      
                      // Fallback card for other types (PDF, etc.)
                      const isSelectedFallback = selectedResults.has(result.document_id);
                      return (
                        <motion.div
                          key={`doc-${result.document_id}-${result.frame_index || 0}-${i}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="w-44 relative group"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSelection(result.document_id)}
                            className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                              isSelectedFallback ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isSelectedFallback && <Check className="h-4 w-4" />}
                          </button>
                          <Link
                            href={`/workspace/${workspaceId}/document/${result.document_id}`}
                            className="block"
                          >
                            <div className={`h-56 rounded-xl overflow-hidden bg-white border border-gray-100 hover:shadow-md transition-all flex flex-col ${isSelectedFallback ? "ring-2 ring-[var(--accent-primary)]" : ""}`}>
                              {/* Preview area */}
                              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                                {thumbnailSrc ? (
                                  <img
                                    src={thumbnailSrc}
                                    alt={result.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    {getFileIcon(result.mime_type || "")}
                                  </div>
                                )}
                              </div>
                              {/* Footer */}
                              <div className="px-3 py-2 border-t border-gray-50 bg-white">
                                <div className="flex items-center gap-1.5">
                                  {getFileIcon(result.mime_type || "")}
                                  <span className="text-xs text-gray-600 truncate">{result.title}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* List view */}
                {viewMode === "list" && (
                  <div className="space-y-2">
                    {results.map((result, i) => {
                      const resultType = result.result_type;
                      const isImage = result.mime_type?.startsWith("image/");
                      const isVideo = result.mime_type?.startsWith("video/");
                      const thumbnailSrc = result.thumbnailUrl || result.previewUrl || result.thumbnail_url || result.thumbnail_path || "";

                      const handleOpen = () => {
                        if (resultType === "scratch") {
                          window.location.href = `/workspace/${workspaceId}/scretch/${result.document_id}`;
                        } else if (resultType === "note") {
                          openInPanel(result.document_id);
                        } else {
                          window.location.href = `/workspace/${workspaceId}/document/${result.document_id}`;
                        }
                      };

                      const typeLabel = resultType === "note"
                        ? "Note"
                        : resultType === "scratch"
                          ? "Scratch"
                          : resultType === "link"
                            ? "Link"
                            : result.mime_type?.split("/")[0] || "File";

                      const isSelectedList = selectedResults.has(result.document_id);
                      return (
                        <motion.div
                          key={`list-${result.document_id}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="group flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSelection(result.document_id)}
                            className={`w-5 flex items-center justify-center transition-opacity ${isSelectedList ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelectedList ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-gray-300"}`}>
                              {isSelectedList && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </button>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={handleOpen}
                            onKeyDown={(e) => e.key === "Enter" && handleOpen()}
                            className={`flex-1 flex items-center gap-4 p-3 rounded-xl border hover:bg-muted/50 transition-colors ${isSelectedList ? "ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10/30" : ""}`}
                          >
                            {thumbnailSrc ? (
                              <img
                                src={thumbnailSrc}
                                alt={result.title}
                                className="w-14 h-14 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                                {isVideo ? (
                                  <Video className="h-6 w-6 text-gray-400" />
                                ) : isImage ? (
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                ) : (
                                  <FileText className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.title || "Untitled"}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {typeLabel}
                                {result.match_context ? ` • ${result.match_context}` : ""}
                              </p>
                            </div>
                            {result.search_type && getSearchTypeBadge(result.search_type)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              />
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* Selection Action Bar */}
        {selectedResults.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-1 border border-[var(--workspace-sidebar-border)] rounded-xl shadow-lg px-2 py-1.5" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
              <span className="px-3 py-1.5 text-sm font-medium bg-[var(--workspace-sidebar-muted)] text-[var(--workspace-sidebar-foreground)] rounded-lg">
                {selectedResults.size} selected
              </span>
              <div className="w-px h-6 bg-[var(--workspace-sidebar-border)] mx-1" />
              
              <button
                type="button"
                onClick={openSelected}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </button>
              
              <button
                type="button"
                onClick={starSelected}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-amber-900/30 hover:text-amber-400 rounded-lg"
              >
                <Star className="h-4 w-4" />
                Star
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 border border-[var(--workspace-sidebar-border)] rounded-xl shadow-lg py-2 z-50" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
                    <button
                      type="button"
                      onClick={() => shareVia("whatsapp")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded text-white text-xs">W</span>
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => shareVia("telegram")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-500 rounded text-white text-xs">T</span>
                      Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => shareVia("x")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-black rounded text-white text-xs">X</span>
                      X (Twitter)
                    </button>
                    <button
                      type="button"
                      onClick={() => shareVia("facebook")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-600 rounded text-white text-xs">f</span>
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => shareVia("linkedin")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-blue-700 rounded text-white text-xs">in</span>
                      LinkedIn
                    </button>
                    <button
                      type="button"
                      onClick={() => shareVia("email")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-gray-500 rounded text-white text-xs">@</span>
                      E-Mail
                    </button>
                    <div className="border-t my-1" />
                    <button
                      type="button"
                      onClick={() => shareVia("copy")}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] text-left"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-gray-400 rounded text-white text-xs">📋</span>
                      Link kopieren
                    </button>
                  </div>
                )}
              </div>
              
              <div className="w-px h-6 bg-[var(--workspace-sidebar-border)] mx-1" />
              <button
                type="button"
                onClick={clearSelection}
                className="p-1.5 text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Panels */}
      <DocumentPanels 
        documents={results.map(r => ({
          id: r.document_id,
          title: r.title,
          mime_type: r.mime_type || "application/octet-stream",
          previewUrl: r.previewUrl,
          created_at: new Date().toISOString(),
        }))} 
        workspaceId={workspaceId || ""} 
        openPanels={openPanels}
        closePanel={closePanel}
        handleMouseDown={handleMouseDown}
      />
    </div>
  );
}
