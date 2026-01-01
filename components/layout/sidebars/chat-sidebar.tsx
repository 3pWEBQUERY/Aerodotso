"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Trash2, Pencil, Copy, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  workspaceId: string;
}

export function ChatSidebar({ workspaceId }: ChatSidebarProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchSessions = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/chat/sessions?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Group sessions by date
  const groupSessionsByDate = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
      today: [],
      yesterday: [],
      pastWeek: [],
      older: [],
    };

    const sorted = [...sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const session of sorted) {
      const sessionDate = new Date(session.created_at);
      if (sessionDate >= today) {
        groups.today.push(session);
      } else if (sessionDate >= yesterday) {
        groups.yesterday.push(session);
      } else if (sessionDate >= pastWeek) {
        groups.pastWeek.push(session);
      } else {
        groups.older.push(session);
      }
    }

    return groups;
  }, [sessions]);

  const groupedSessions = groupSessionsByDate();

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await fetch("/api/chat/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, title: editingTitle.trim() }),
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, title: editingTitle.trim() } : s
        )
      );
    } catch (error) {
      console.error("Failed to update title:", error);
    } finally {
      setEditingId(null);
    }
  };

  const duplicateSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // For now, just create a new session with copied title
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: `${session.title} (Copy)`,
        }),
      });
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
      }
    } catch (error) {
      console.error("Failed to duplicate session:", error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch("/api/chat/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const renderSessionList = (sessionList: ChatSession[]) =>
    sessionList.map((session) => {
      const isActive = pathname === `/workspace/${workspaceId}/chat/${session.id}`;

      return (
        <div
          key={session.id}
          className={`group flex items-center rounded-md hover:bg-[var(--workspace-sidebar-muted)] mb-0.5 overflow-hidden ${
            isActive ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : ""
          }`}
        >
          {editingId === session.id ? (
            <div className="flex-1 flex items-center gap-2 px-2 py-1">
              <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => saveTitle(session.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveTitle(session.id);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingId(null);
                  }
                }}
                className="flex-1 bg-[var(--workspace-sidebar-muted)] border border-[var(--workspace-sidebar-border)] rounded px-1 py-0.5 text-xs text-[var(--workspace-sidebar-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <>
              <Link
                href={`/workspace/${workspaceId}/chat`}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--workspace-sidebar-muted-foreground)]"
              >
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{session.title}</span>
              </Link>
              {/* Hover action buttons - 3 buttons like in the image */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => startEditing(session, e)}
                  className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => duplicateSession(session.id, e)}
                  className="p-1 hover:bg-[var(--workspace-sidebar-muted)] rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-[var(--workspace-sidebar-foreground)]"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteSession(session.id, e)}
                  className="p-1 hover:bg-red-500/20 rounded text-[var(--workspace-sidebar-muted-foreground)] hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>
      );
    });

  return (
    <aside className="w-64 flex-shrink-0 rounded-xl text-sm flex flex-col overflow-hidden border border-[var(--workspace-sidebar-border)]" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>
      {/* Chat Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[var(--workspace-sidebar-border)] text-[var(--workspace-sidebar-foreground)]">
        <span className="font-medium">Chat</span>
      </header>

      {/* New Chat Button */}
      <div className="px-3 py-2 border-b border-[var(--workspace-sidebar-border)]">
        <Link
          href={`/workspace/${workspaceId}/chat`}
          className="flex w-full items-center gap-2 px-2 py-1.5 bg-[var(--workspace-sidebar-muted)] border border-[var(--workspace-sidebar-border)] rounded-lg text-xs font-medium text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)]/80 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          New Chat
        </Link>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
        {groupedSessions.today.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('today')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.today ? '' : 'rotate-90'}`} />
              <span>Today</span>
            </button>
            {!collapsedSections.today && renderSessionList(groupedSessions.today)}
          </div>
        )}

        {groupedSessions.yesterday.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('yesterday')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.yesterday ? '' : 'rotate-90'}`} />
              <span>Yesterday</span>
            </button>
            {!collapsedSections.yesterday && renderSessionList(groupedSessions.yesterday)}
          </div>
        )}

        {groupedSessions.pastWeek.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('pastWeek')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.pastWeek ? '' : 'rotate-90'}`} />
              <span>Past Week</span>
            </button>
            {!collapsedSections.pastWeek && renderSessionList(groupedSessions.pastWeek)}
          </div>
        )}

        {groupedSessions.older.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => toggleSection('older')}
              className="flex items-center gap-1 text-[10px] text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider mb-1 hover:text-[var(--workspace-sidebar-foreground)] transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${collapsedSections.older ? '' : 'rotate-90'}`} />
              <span>Older</span>
            </button>
            {!collapsedSections.older && renderSessionList(groupedSessions.older)}
          </div>
        )}

        {sessions.length === 0 && (
          <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center py-4">
            No chats yet
          </p>
        )}
      </div>

    </aside>
  );
}
