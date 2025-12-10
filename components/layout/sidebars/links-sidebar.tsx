"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Trash2, Pencil, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LinkItem {
  id: string;
  url: string;
  title: string;
  created_at: string;
}

interface LinksSidebarProps {
  workspaceId: string;
}

export function LinksSidebar({ workspaceId }: LinksSidebarProps) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const fetchLinks = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/links?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.links) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Group links by date
  const groupLinksByDate = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const groups: { [key: string]: LinkItem[] } = {
      today: [],
      yesterday: [],
      pastWeek: [],
      older: [],
    };

    const sorted = [...links].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const link of sorted) {
      const linkDate = new Date(link.created_at);
      if (linkDate >= today) {
        groups.today.push(link);
      } else if (linkDate >= yesterday) {
        groups.yesterday.push(link);
      } else if (linkDate >= pastWeek) {
        groups.pastWeek.push(link);
      } else {
        groups.older.push(link);
      }
    }

    return groups;
  }, [links]);

  const groupedLinks = groupLinksByDate();

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const startEditing = (link: LinkItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(link.id);
    setEditingTitle(link.title || getDomain(link.url));
  };

  const saveTitle = async (linkId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      setLinks((prev) =>
        prev.map((l) =>
          l.id === linkId ? { ...l, title: editingTitle.trim() } : l
        )
      );
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const copyLink = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const deleteLink = async (linkId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      });

      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  };

  const renderLinkList = (linkList: LinkItem[]) =>
    linkList.map((link) => (
      <div
        key={link.id}
        className="group flex items-center rounded-md hover:bg-muted mb-0.5 overflow-hidden"
      >
        {editingId === link.id ? (
          <div className="flex-1 flex items-center gap-2 px-2 py-1">
            <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={() => saveTitle(link.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveTitle(link.id);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingId(null);
                }
              }}
              className="flex-1 bg-white border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"
            >
              <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate max-w-[80px]">
                {link.title || getDomain(link.url)}
              </span>
            </a>
            {/* Hover action buttons - 3 buttons like in the image */}
            <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => startEditing(link, e)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => copyLink(link.url, e)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                title="Copy URL"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => deleteLink(link.id, e)}
                className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>
    ));

  return (
    <aside className="w-44 flex-shrink-0 border-r text-sm flex flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between px-3 py-2 border-b">
        <span className="font-medium">Links</span>
      </header>

      {/* All Links Button */}
      <div className="px-3 py-2 border-b">
        <Link
          href={`/workspace/${workspaceId}/links`}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs bg-muted font-medium"
        >
          <Link2 className="h-3.5 w-3.5" />
          All Links
        </Link>
      </div>

      {/* Links List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {groupedLinks.today.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Today
            </p>
            {renderLinkList(groupedLinks.today)}
          </>
        )}

        {groupedLinks.yesterday.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Yesterday
            </p>
            {renderLinkList(groupedLinks.yesterday)}
          </>
        )}

        {groupedLinks.pastWeek.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Past Week
            </p>
            {renderLinkList(groupedLinks.pastWeek)}
          </>
        )}

        {groupedLinks.older.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Older
            </p>
            {renderLinkList(groupedLinks.older)}
          </>
        )}

        {links.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No links yet
          </p>
        )}
      </div>

      {/* Trash */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Trash2 className="h-3.5 w-3.5" />
        <span>Trash</span>
      </div>
    </aside>
  );
}
