"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Clock, Tag, SlidersHorizontal, Sparkles, FileText, ImageIcon, Trash2 } from "lucide-react";

interface RecentSearch {
  query: string;
  result_count: number;
  created_at: string;
}

interface SearchSidebarProps {
  workspaceId: string;
  onSearchSelect?: (query: string) => void;
  searchTypes?: string[];
  onSearchTypesChange?: (types: string[]) => void;
}

export function SearchSidebar({ 
  workspaceId, 
  onSearchSelect,
  searchTypes = ["semantic", "text", "visual"],
  onSearchTypesChange
}: SearchSidebarProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [localSearchTypes, setLocalSearchTypes] = useState(searchTypes);

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

  const handleSearchTypeChange = (id: string, checked: boolean) => {
    const newTypes = checked 
      ? [...localSearchTypes, id]
      : localSearchTypes.filter(t => t !== id);
    setLocalSearchTypes(newTypes);
    onSearchTypesChange?.(newTypes);
  };

  return (
    <aside className="w-52 flex-shrink-0 border-r text-sm flex flex-col overflow-hidden bg-muted/30">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Search
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent
            </p>
            <div className="space-y-0.5">
              {recentSearches.slice(0, 5).map((search, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSearchSelect?.(search.query)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Search className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{search.query}</span>
                  <span className="text-[10px] opacity-50">{search.result_count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Tags */}
        {suggestedTags.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSearchSelect?.(tag)}
                  className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Type Filters */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Search Types
          </p>
          <div className="space-y-1">
            {[
              { id: "semantic", label: "AI Semantic", icon: Sparkles },
              { id: "text", label: "Text Match", icon: FileText },
              { id: "visual", label: "Visual Search", icon: ImageIcon },
            ].map(({ id, label, icon: Icon }) => (
              <label
                key={id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={localSearchTypes.includes(id)}
                  onChange={(e) => handleSearchTypeChange(id, e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 hover:bg-muted cursor-pointer">
        <Trash2 className="h-3.5 w-3.5" />
        <span>Clear History</span>
      </div>
    </aside>
  );
}
