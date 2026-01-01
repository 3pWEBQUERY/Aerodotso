"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  MoreHorizontal,
  Pencil,
  FolderInput,
  Trash2,
  Info,
  ChevronRight,
  Users,
  LayoutPanelLeft,
  FolderClosed,
  Check,
  Home,
  History,
  Download,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePanels } from "@/contexts/panel-context";

interface Folder {
  id: string;
  name: string;
  workspace_id: string;
}

interface ItemHeaderActionsProps {
  itemId: string;
  itemType: "note" | "canvas" | "scratch" | "document";
  itemTitle: string;
  workspaceId: string;
  isStarred: boolean;
  currentFolderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  onToggleStar: () => void;
  onStartRename?: () => void;
  onMove?: (folderId: string | null) => Promise<void>;
  onDelete: () => Promise<void>;
  onDownload?: () => void;
}

export function ItemHeaderActions({
  itemId,
  itemType,
  itemTitle,
  workspaceId,
  isStarred,
  currentFolderId,
  createdAt,
  updatedAt,
  onToggleStar,
  onStartRename,
  onMove,
  onDelete,
  onDownload,
}: ItemHeaderActionsProps) {
  const router = useRouter();
  const { openPanel } = usePanels();
  
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch folders when move menu opens
  useEffect(() => {
    if (moveMenuOpen) {
      fetchFolders();
    }
  }, [moveMenuOpen]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/folders?workspaceId=${workspaceId}`);
      if (response.ok) {
        const { folders } = await response.json();
        setFolders(folders || []);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const handleOpenInPane = () => {
    openPanel({
      type: itemType,
      itemId: itemId,
      title: itemTitle,
    });
    setMoreMenuOpen(false);
  };

  const handleStarClick = () => {
    onToggleStar();
    setMoreMenuOpen(false);
  };

  const handleRenameClick = () => {
    setMoreMenuOpen(false);
    if (onStartRename) {
      onStartRename();
    }
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (onMove) {
      await onMove(folderId);
      setMoveMenuOpen(false);
      setMoreMenuOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setMoreMenuOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload();
    }
    setMoreMenuOpen(false);
  };

  const getItemTypeLabel = () => {
    switch (itemType) {
      case "note": return "Note";
      case "canvas": return "Canvas";
      case "scratch": return "Scratch";
      case "document": return "Document";
      default: return "Item";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatVersionDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <>
      {/* More Menu Dropdown */}
      <Popover open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="end" style={{ backgroundColor: 'var(--workspace-sidebar)', borderColor: 'var(--workspace-sidebar-border)' }}>
          {/* Open in new pane */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
            onClick={handleOpenInPane}
          >
            <LayoutPanelLeft className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
            Open in new pane
          </button>

          {/* Star */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
            onClick={handleStarClick}
          >
            <Star className={`h-4 w-4 ${isStarred ? "text-amber-500" : "text-[var(--workspace-sidebar-muted-foreground)]"}`} />
            {isStarred ? "Unstar" : "Star"}
          </button>

          {/* Rename */}
          {onStartRename && (
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
              onClick={handleRenameClick}
            >
              <Pencil className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
              Rename
            </button>
          )}

          {/* Move to submenu */}
          {onMove && (
            <Popover open={moveMenuOpen} onOpenChange={setMoveMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <FolderInput className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                    Move to
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" side="left" align="start" style={{ backgroundColor: 'var(--workspace-sidebar)', borderColor: 'var(--workspace-sidebar-border)' }}>
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                    currentFolderId === null ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)]"
                  }`}
                  onClick={() => handleMoveToFolder(null)}
                >
                  <Home className="h-4 w-4" />
                  Root (No Folder)
                  {currentFolderId === null && <Check className="h-4 w-4 ml-auto" />}
                </button>
                {folders.length > 0 && <div className="h-px bg-[var(--workspace-sidebar-border)] my-1" />}
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                      currentFolderId === folder.id ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)]"
                    }`}
                    onClick={() => handleMoveToFolder(folder.id)}
                  >
                    <FolderClosed className="h-4 w-4" />
                    <span className="truncate">{folder.name}</span>
                    {currentFolderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] px-3 py-2">No folders yet</p>
                )}
              </PopoverContent>
            </Popover>
          )}

          {/* Version History submenu */}
          <Popover open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
              >
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  Version History
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" side="left" align="start" style={{ backgroundColor: 'var(--workspace-sidebar)', borderColor: 'var(--workspace-sidebar-border)' }}>
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-[var(--workspace-sidebar-foreground)]">Version History</h4>
                <div className="h-px bg-[var(--workspace-sidebar-border)]" />
                
                {/* Current Version */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-[var(--accent-primary)]/10 rounded-lg border border-[var(--accent-primary)]/30">
                    <div>
                      <p className="text-xs font-medium text-[var(--accent-primary)]">Current Version</p>
                      <p className="text-xs text-[var(--accent-primary-light)]">
                        {updatedAt ? formatVersionDate(new Date(updatedAt)) : "Just now"}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--accent-primary-light)] bg-[var(--accent-primary)]/20 px-2 py-0.5 rounded">Active</span>
                  </div>
                  
                  {/* Previous versions placeholder */}
                  <div className="p-2 hover:bg-[var(--workspace-sidebar-muted)] rounded-lg cursor-pointer border border-[var(--workspace-sidebar-border)]">
                    <p className="text-xs font-medium text-[var(--workspace-sidebar-foreground)]">Created</p>
                    <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)]">
                      {createdAt ? formatVersionDate(new Date(createdAt)) : "Unknown"}
                    </p>
                  </div>
                </div>
                
                <div className="h-px bg-[var(--workspace-sidebar-border)]" />
                <p className="text-xs text-[var(--workspace-sidebar-muted-foreground)] text-center">
                  Auto-save enabled • Versions are saved automatically
                </p>
              </div>
            </PopoverContent>
          </Popover>

          {/* Download */}
          {onDownload && (
            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
              onClick={handleDownloadClick}
            >
              <Download className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
              Download
            </button>
          )}

          <div className="h-px bg-[var(--workspace-sidebar-border)] my-1" />

          {/* Delete */}
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          <div className="h-px bg-[var(--workspace-sidebar-border)] my-1" />

          {/* Information submenu */}
          <Popover open={infoMenuOpen} onOpenChange={setInfoMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--workspace-sidebar-foreground)] hover:bg-[var(--workspace-sidebar-muted)] rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
                  Information
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--workspace-sidebar-muted-foreground)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" side="left" align="end" style={{ backgroundColor: 'var(--workspace-sidebar)', borderColor: 'var(--workspace-sidebar-border)' }}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--workspace-sidebar-foreground)]">
                  <Users className="h-4 w-4" />
                  <span>Visible to</span>
                  <span className="text-[var(--accent-primary-light)] font-medium">Workspace members</span>
                </div>
                <div className="h-px bg-[var(--workspace-sidebar-border)]" />
                <div className="text-xs text-[var(--workspace-sidebar-muted-foreground)] space-y-1">
                  <p><span className="font-medium text-[var(--workspace-sidebar-foreground)]">Created:</span> {formatDate(createdAt)}</p>
                  <p><span className="font-medium text-[var(--workspace-sidebar-foreground)]">Modified:</span> {formatDate(updatedAt)}</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getItemTypeLabel()} löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. {getItemTypeLabel() === "Note" ? "Die Notiz" : getItemTypeLabel() === "Canvas" ? "Das Canvas" : getItemTypeLabel() === "Scratch" ? "Das Scratch" : "Das Dokument"} wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
