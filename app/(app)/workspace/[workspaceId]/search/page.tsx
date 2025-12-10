"use client";

import { useParams } from "next/navigation";
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
  Grid3X3,
  List
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDocumentPanels, DocumentPanels } from "@/components/workspace/document-panels";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchResult {
  document_id: string;
  title: string;
  mime_type: string;
  storage_path: string;
  thumbnail_path?: string;
  description?: string;
  tags?: string[];
  ai_summary?: string;
  similarity: number;
  search_type: string;
  frame_index?: number;
  timestamp_seconds?: number;
  match_context?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
}

interface RecentSearch {
  query: string;
  result_count: number;
  created_at: string;
}

export default function WorkspaceSearchPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params?.workspaceId;
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTypes, setSearchTypes] = useState<string[]>(["semantic", "text", "visual"]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { openPanels, openInPanel, closePanel, handleMouseDown } = useDocumentPanels();
  const inputRef = useRef<HTMLInputElement>(null);

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
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [query, workspaceId, searchTypes]);

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

  // Get icon for file type
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (mimeType?.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (mimeType?.startsWith("audio/")) return <Music className="h-4 w-4" />;
    if (mimeType === "application/pdf") return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
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
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center">
          {/* Search Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-medium mb-2">
              Find anything in your workspace
            </h1>
            <p className="text-muted-foreground">
              Search by description, content, or visual appearance
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by description, color, or content..."
                className="w-full pl-12 pr-24 py-4 text-lg border rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setHasSearched(false);
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={!query.trim() || isSearching}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Search
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 px-2">
              <span className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd> to focus
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "grid" ? "bg-muted" : "hover:bg-muted"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "list" ? "bg-muted" : "hover:bg-muted"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {isSearching ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
                <p className="text-muted-foreground">Searching with AI...</p>
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

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {results.map((result, i) => (
                      <motion.div
                        key={`${result.document_id}-${result.frame_index || 0}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group relative"
                      >
                        <Link
                          href={`/workspace/${workspaceId}/document/${result.document_id}`}
                          className="block"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-muted border hover:border-emerald-500/50 hover:shadow-lg transition-all">
                            {result.thumbnailUrl || result.previewUrl ? (
                              <img
                                src={result.thumbnailUrl || result.previewUrl}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                {getFileIcon(result.mime_type)}
                              </div>
                            )}
                            
                            {/* Overlay with info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm font-medium truncate">
                                  {result.title}
                                </p>
                                {result.timestamp_seconds !== undefined && result.timestamp_seconds > 0 && (
                                  <p className="text-white/70 text-xs">
                                    at {formatTimestamp(result.timestamp_seconds)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Search type badge */}
                            <div className="absolute top-2 left-2">
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] rounded-full font-medium",
                                result.search_type === "semantic" && "bg-purple-100 text-purple-700",
                                result.search_type === "visual" && "bg-blue-100 text-blue-700",
                                result.search_type === "text" && "bg-gray-100 text-gray-700"
                              )}>
                                {result.search_type === "semantic" && "AI"}
                                {result.search_type === "visual" && "Visual"}
                                {result.search_type === "text" && "Text"}
                              </span>
                            </div>

                            {/* Similarity score */}
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 text-[10px] bg-black/50 text-white rounded-full">
                                {Math.round(result.similarity * 100)}%
                              </span>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Open in panel button */}
                        <button
                          type="button"
                          onClick={() => openInPanel(result.document_id)}
                          className="absolute top-2 right-10 p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white transition-all shadow-sm"
                        >
                          <PanelRight className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.map((result, i) => (
                      <motion.div
                        key={`${result.document_id}-${result.frame_index || 0}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Link
                          href={`/workspace/${workspaceId}/document/${result.document_id}`}
                          className="group flex items-center gap-4 p-3 rounded-xl border hover:border-emerald-500/50 hover:bg-muted/50 transition-all"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {result.thumbnailUrl || result.previewUrl ? (
                              <img
                                src={result.thumbnailUrl || result.previewUrl}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getFileIcon(result.mime_type)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">{result.title}</h3>
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] rounded-full font-medium flex-shrink-0",
                                result.search_type === "semantic" && "bg-purple-100 text-purple-700",
                                result.search_type === "visual" && "bg-blue-100 text-blue-700",
                                result.search_type === "text" && "bg-gray-100 text-gray-700"
                              )}>
                                {result.search_type}
                              </span>
                            </div>
                            {result.ai_summary && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {result.ai_summary}
                              </p>
                            )}
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {result.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-muted rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm text-muted-foreground">
                              {Math.round(result.similarity * 100)}%
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                openInPanel(result.document_id);
                              }}
                              className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <PanelRight className="h-4 w-4" />
                            </button>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="text-xl font-medium mb-2">
                  The world's most powerful visual search
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Describe what you're looking for. Search by color, object, text, or concept. 
                  Find any video frame, image, or file instantly.
                </p>
                
                {/* Example searches */}
                <div className="mt-8">
                  <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "person wearing red",
                      "beach sunset",
                      "meeting notes",
                      "diagram with arrows",
                      "text on whiteboard"
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          setQuery(example);
                          handleSearch(example);
                        }}
                        className="px-3 py-1.5 text-sm border rounded-full hover:bg-muted hover:border-emerald-500/50 transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Document Panels */}
      <DocumentPanels 
        documents={results.map(r => ({
          id: r.document_id,
          title: r.title,
          mime_type: r.mime_type,
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
