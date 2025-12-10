"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Trash2, Pencil, Copy, Sparkles } from "lucide-react";
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
          className={`group flex items-center rounded-md hover:bg-muted mb-0.5 overflow-hidden ${
            isActive ? "bg-emerald-50 text-emerald-700" : ""
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
                className="flex-1 bg-white border rounded px-1 py-0.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <>
              <Link
                href={`/workspace/${workspaceId}/chat`}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate max-w-[80px]">{session.title}</span>
              </Link>
              {/* Hover action buttons - 3 buttons like in the image */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => startEditing(session, e)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => duplicateSession(session.id, e)}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteSession(session.id, e)}
                  className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600"
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
    <aside className="w-44 flex-shrink-0 border-r text-sm flex flex-col overflow-hidden bg-background">
      {/* New Chat Button */}
      <div className="px-3 py-2 border-b">
        <Link
          href={`/workspace/${workspaceId}/chat`}
          className="flex w-full items-center gap-2 px-2 py-1.5 bg-white border rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          New Chat
        </Link>
      </div>

      {/* My Chats Header */}
      <div className="px-3 py-2">
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          My Chats
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {groupedSessions.today.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Today
            </p>
            {renderSessionList(groupedSessions.today)}
          </>
        )}

        {groupedSessions.yesterday.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Yesterday
            </p>
            {renderSessionList(groupedSessions.yesterday)}
          </>
        )}

        {groupedSessions.pastWeek.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Past Week
            </p>
            {renderSessionList(groupedSessions.pastWeek)}
          </>
        )}

        {groupedSessions.older.length > 0 && (
          <>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 mt-3">
              Older
            </p>
            {renderSessionList(groupedSessions.older)}
          </>
        )}

        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No chats yet
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
