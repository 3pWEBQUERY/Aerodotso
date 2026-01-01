"use client";

import { StickyNote, LayoutTemplate, Link2, ImageIcon, Pencil, FolderClosed, TrendingUp, Sparkles } from "lucide-react";
import { useMemo } from "react";

interface WorkspaceStatsProps {
  notesCount: number;
  canvasesCount: number;
  linksCount: number;
  mediaCount: number;
  scratchesCount: number;
  foldersCount: number;
}

export function WorkspaceStats({
  notesCount,
  canvasesCount,
  linksCount,
  mediaCount,
  scratchesCount,
  foldersCount,
}: WorkspaceStatsProps) {
  const stats = [
    { label: "Notes", count: notesCount, icon: StickyNote, gradient: "from-amber-500 to-orange-600", bgGlow: "bg-amber-500" },
    { label: "Canvases", count: canvasesCount, icon: LayoutTemplate, gradient: "from-violet-500 to-purple-600", bgGlow: "bg-violet-500" },
    { label: "Links", count: linksCount, icon: Link2, gradient: "from-cyan-500 to-blue-600", bgGlow: "bg-cyan-500" },
    { label: "Media", count: mediaCount, icon: ImageIcon, gradient: "from-emerald-500 to-teal-600", bgGlow: "bg-emerald-500" },
    { label: "Scratches", count: scratchesCount, icon: Pencil, gradient: "from-rose-500 to-pink-600", bgGlow: "bg-rose-500" },
    { label: "Folders", count: foldersCount, icon: FolderClosed, gradient: "from-orange-500 to-amber-600", bgGlow: "bg-orange-500" },
  ];

  const total = notesCount + canvasesCount + linksCount + mediaCount + scratchesCount;

  // Calculate the distribution for the visual bar
  const distribution = useMemo(() => {
    if (total === 0) return [];
    return stats.slice(0, 5).map((stat) => ({
      ...stat,
      percentage: (stat.count / total) * 100,
    }));
  }, [stats, total]);

  // Find the dominant type
  const dominantType = useMemo(() => {
    const maxStat = stats.slice(0, 5).reduce((prev, current) => 
      (prev.count > current.count) ? prev : current
    );
    return maxStat.count > 0 ? maxStat.label : null;
  }, [stats]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--workspace-sidebar-border)] p-5" style={{ backgroundColor: 'var(--workspace-sidebar)' }}>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-medium text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider">Workspace Overview</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold text-[var(--workspace-sidebar-foreground)]">{total}</span>
              <span className="text-xs text-[var(--workspace-sidebar-muted-foreground)]">Items</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <span className="text-[11px] font-medium text-[var(--accent-primary)]">{foldersCount} Folders</span>
            </div>
          </div>
        </div>

        {/* Distribution Bar */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--workspace-sidebar-muted)]">
              {distribution.map((item, index) => (
                <div
                  key={item.label}
                  className={`bg-gradient-to-r ${item.gradient} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {stats.map(({ label, count, icon: Icon, gradient, bgGlow }) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={label}
                className="group relative overflow-hidden rounded-lg bg-[var(--workspace-sidebar-muted)] p-3 transition-all duration-200 hover:bg-[var(--workspace-sidebar-muted)]/80"
              >
                <div className="relative flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] truncate">{label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold text-[var(--workspace-sidebar-foreground)]">{count}</span>
                      {label !== "Folders" && total > 0 && (
                        <span className="text-[9px] text-[var(--workspace-sidebar-muted-foreground)]">{percentage}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer insights */}
        {dominantType && total > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--workspace-sidebar-border)]">
            <div className="flex items-center gap-2 text-[11px] text-[var(--workspace-sidebar-muted-foreground)]">
              <TrendingUp className="h-3 w-3 text-[var(--accent-primary)]" />
              <span>Most used: <span className="text-[var(--workspace-sidebar-foreground)] font-medium">{dominantType}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

