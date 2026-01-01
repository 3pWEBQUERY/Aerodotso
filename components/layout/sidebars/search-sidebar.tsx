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
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Search</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-hide">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent
            </p>
            <div className="space-y-0.5">
              {recentSearches.slice(0, 5).map((search, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSearchSelect?.(search.query)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)] hover:bg-[var(--workspace-sidebar-muted)] hover:text-[var(--workspace-sidebar-foreground)] transition-colors"
                >
                  <Search className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{search.query}</span>
                  <span className="text-[10px] opacity-50">{search.result_count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
