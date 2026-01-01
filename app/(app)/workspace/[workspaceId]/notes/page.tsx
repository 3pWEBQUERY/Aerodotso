"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { StickyNote, Trash2, FileText, Plus, FolderClosed, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SelectionActionBar } from "@/components/workspace/selection-action-bar";
import { AnimatedFolder } from "@/components/workspace/animated-folder";
import { PageToolbar, ViewMode, SortOption } from "@/components/workspace/page-toolbar";
import { NoteCard } from "@/components/workspace/note-card";
import { NoteCardList } from "@/components/workspace/note-card-list";
import { NoteCardCompact } from "@/components/workspace/note-card-compact";
import { DraggableItem } from "@/components/workspace/draggable-item";
import { DroppableFolder } from "@/components/workspace/droppable-folder";
import { usePanels } from "@/contexts/panel-context";

interface Note {
  id: string;
  title: string;
  content: string;
  folder_id?: string | null;
  is_starred?: boolean;
  created_at: string;
  cover_image?: string | null;
}

interface Folder {
  id: string;
  name: string;
  type: string;
  parent_folder_id?: string | null;
}

// Empty state with hover effect and create functionality
function EmptyState({ workspaceId, onCreate }: { workspaceId: string; onCreate: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <button
        type="button"
        onClick={onCreate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative mb-4 focus:outline-none"
      >
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
          ${isHovered ? "bg-[var(--accent-primary)]/10 ring-2 ring-[var(--accent-primary)]/30" : "bg-gray-100"}
        `}>
          <StickyNote className={`
            h-7 w-7 transition-colors duration-200
            ${isHovered ? "text-[var(--accent-primary-light)]" : "text-gray-400"}
          `} />
        </div>
        {isHovered && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
            <Plus className="h-3 w-3 text-[var(--accent-primary-light)]" />
          </div>
        )}
      </button>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {isHovered ? "New Note" : "No notes"}
      </h2>
      <p className="text-sm text-gray-500">Create your first note.</p>
    </div>
  );
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function WorkspaceNotesPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openPanel } = usePanels();
  const workspaceId = params?.workspaceId;
  
  // Get current folder from URL
  const currentFolderId = searchParams.get("folder");
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date_added");
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Selection state
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  
  
  // Move popover
  const [showMovePopover, setShowMovePopover] = useState(false);
  
  // Get current folder info
  const currentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;
  
  // Get subfolders of current folder
  const currentSubfolders = folders.filter(f => 
    currentFolderId ? f.parent_folder_id === currentFolderId : !f.parent_folder_id
  );
  
  // Get notes in current folder
  const notesInCurrentFolder = notes.filter(n => 
    currentFolderId ? n.folder_id === currentFolderId : !n.folder_id
  );
  
  // Build breadcrumb path
  const buildBreadcrumbPath = (): Folder[] => {
    const path: Folder[] = [];
    let current = currentFolder;
    while (current) {
      path.unshift(current);
      current = current.parent_folder_id ? folders.find(f => f.id === current!.parent_folder_id) : null;
    }
    return path;
  };
  
  const breadcrumbPath = buildBreadcrumbPath();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [notesRes, foldersRes] = await Promise.all([
        fetch(`/api/notes?workspaceId=${workspaceId}`),
        fetch(`/api/folders?workspaceId=${workspaceId}&type=notes`)
      ]);
      const notesData = await notesRes.json();
      const foldersData = await foldersRes.json();
      if (notesData.notes) setNotes(notesData.notes);
      if (foldersData.folders) setFolders(foldersData.folders);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create new note (in current folder if inside one)
  const createNote = async () => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: "Untitled Note",
          content: "",
          folder_id: currentFolderId || null,
        }),
      });
      if (response.ok) {
        const { note } = await response.json();
        router.push(`/workspace/${workspaceId}/notes/${note.id}`);
      }
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // Handle folder created from toolbar
  const handleFolderCreated = (folder: { id: string; name: string }) => {
    setFolders(prev => [...prev, { ...folder, type: "notes" }]);
  };

  // Selection handlers
  const toggleNoteSelection = (noteId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  const clearSelection = () => setSelectedNotes(new Set());

  // Delete selected notes
  const deleteSelected = async () => {
    const ids = Array.from(selectedNotes);
    try {
      await Promise.all(ids.map(id => 
        fetch(`/api/notes/${id}`, { method: "DELETE" })
      ));
      setNotes(prev => prev.filter(n => !ids.includes(n.id)));
      clearSelection();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Star selected notes (placeholder)
  const starSelected = async () => {
    console.log("Star notes:", Array.from(selectedNotes));
    clearSelection();
  };

  // Move to folder
  const moveToFolder = async (folderId: string | null) => {
    const ids = Array.from(selectedNotes);
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder_id: folderId }),
        })
      ));
      setNotes(prev => prev.map(n => 
        ids.includes(n.id) ? { ...n, folder_id: folderId } : n
      ));
      clearSelection();
      setShowMovePopover(false);
    } catch (error) {
      console.error("Failed to move:", error);
    }
  };

  // Handle drag-and-drop to folder
  const handleDropToFolder = async (folderId: string, itemId: string, itemType: string) => {
    if (itemType !== "note") return;
    try {
      await fetch(`/api/notes/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      setNotes(prev => prev.map(n => 
        n.id === itemId ? { ...n, folder_id: folderId } : n
      ));
    } catch (error) {
      console.error("Failed to move note to folder:", error);
    }
  };

  // Sort notes (use notes in current folder)
  const sortedNotes = [...notesInCurrentFolder].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "date_added") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "last_modified") cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    else if (sortBy === "name") cmp = a.title.localeCompare(b.title);
    return sortAsc ? -cmp : cmp;
  });

  // Search results state
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);

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
        // Filter only notes from results
        const noteResults: Note[] = data.results
          .filter((r: any) => r.result_type === "note")
          .map((r: any) => ({
            id: r.document_id,
            title: r.title,
            content: r.content || "",
            created_at: r.created_at || new Date().toISOString(),
            is_starred: false,
          }));
        setSearchResults(noteResults);
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
  const filteredNotes = searchResults !== null 
    ? searchResults 
    : sortedNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto p-6">
        {/* Breadcrumb Navigation */}
        {currentFolderId && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link
              href={`/workspace/${workspaceId}/notes`}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Notes</span>
            </Link>
            {breadcrumbPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                {index === breadcrumbPath.length - 1 ? (
                  <div className="flex items-center gap-1 text-gray-700 font-medium">
                    <FolderClosed className="h-3.5 w-3.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </div>
                ) : (
                  <Link
                    href={`/workspace/${workspaceId}/notes?folder=${folder.id}`}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <FolderClosed className="h-3.5 w-3.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Page Toolbar */}
        <PageToolbar
          pageType="notes"
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearch={() => handleSearch(searchQuery)}
          isSearching={isSearching}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortAsc={sortAsc}
          onSortAscChange={setSortAsc}
          sortOptions={["date_added", "last_modified", "name"]}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          workspaceId={workspaceId || ""}
          folders={folders}
          onFolderCreated={handleFolderCreated}
          folderType="notes"
          currentFolderId={currentFolderId}
          primaryAction={
            <button
              type="button"
              onClick={createNote}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-sm rounded-lg hover:bg-[var(--accent-primary-hover)]"
            >
              <Plus className="h-4 w-4" />
              New Note
            </button>
          }
        />

        {/* Content */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredNotes.length === 0 && currentSubfolders.length === 0 ? (
            currentFolderId ? (
              <div className="flex flex-col items-center justify-center py-32">
                <FolderClosed className="h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Empty folder</h2>
                <p className="text-sm text-gray-500">Create a note or subfolder in this folder.</p>
              </div>
            ) : (
              <EmptyState workspaceId={workspaceId || ""} onCreate={createNote} />
            )
          ) : (
            <>
              {/* GRID VIEW */}
              {viewMode === "grid" && (
                <div className="flex flex-wrap gap-4">
                  {/* Subfolders (folders in current directory) - droppable */}
                  {currentSubfolders.map((folder) => {
                    // Count notes in this folder
                    const notesInFolder = notes.filter(n => n.folder_id === folder.id);
                    return (
                      <DroppableFolder
                        key={folder.id}
                        folderId={folder.id}
                        folderName={folder.name}
                        workspaceId={workspaceId || ""}
                        fileCount={notesInFolder.length}
                        previewFiles={notesInFolder.slice(0, 3).map(n => ({
                          type: "note",
                          name: stripHtml(n.title) || "Untitled"
                        }))}
                        onDrop={handleDropToFolder}
                        acceptTypes={["note"]}
                      />
                    );
                  })}

                  {/* Notes - draggable */}
                  {filteredNotes.map((note) => (
                    <DraggableItem key={note.id} itemId={note.id} itemType="note">
                      <div className="w-44">
                        <NoteCard
                          note={note}
                          isSelected={selectedNotes.has(note.id)}
                          onSelect={(e) => toggleNoteSelection(note.id, e)}
                          onClick={() => router.push(`/workspace/${workspaceId}/notes/${note.id}`)}
                          onOpenInPanel={() => openPanel({
                            type: "note",
                            itemId: note.id,
                            title: stripHtml(note.title) || "Untitled",
                          })}
                        />
                      </div>
                    </DraggableItem>
                  ))}
                </div>
              )}

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <div className="space-y-2">
                  {filteredNotes.map((note) => (
                    <NoteCardList
                      key={note.id}
                      note={note}
                      workspaceId={workspaceId || ""}
                      isSelected={selectedNotes.has(note.id)}
                      onSelect={() => toggleNoteSelection(note.id)}
                    />
                  ))}
                </div>
              )}

              {/* COMPACT VIEW */}
              {viewMode === "compact" && (
                <div className="space-y-0">
                  {filteredNotes.map((note, i) => (
                    <div key={note.id} className={i > 0 ? "mt-1" : ""}>
                      <NoteCardCompact
                        note={note}
                        workspaceId={workspaceId || ""}
                        isSelected={selectedNotes.has(note.id)}
                        onSelect={() => toggleNoteSelection(note.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Selection Action Bar */}
        <SelectionActionBar
          selectedCount={selectedNotes.size}
          folders={folders}
          showMovePopover={showMovePopover}
          onToggleMovePopover={() => setShowMovePopover(!showMovePopover)}
          onMoveToFolder={moveToFolder}
          onStar={starSelected}
          onDelete={deleteSelected}
          onClear={clearSelection}
        />
      </div>
    </div>
  );
}
