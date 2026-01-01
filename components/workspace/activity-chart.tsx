"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, Link2, LayoutTemplate, Pencil, StickyNote } from "lucide-react";

interface ActivityData {
  date: string;
  count: number;
  details?: Record<string, number>;
}

interface ActivityChartProps {
  workspaceId: string;
  year?: number;
}

interface TooltipData {
  x: number;
  y: number;
  date: Date;
  count: number;
  details?: Record<string, number>;
}

export function ActivityChart({ workspaceId, year }: ActivityChartProps) {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const activeYear = year ?? currentYear;

  // Keep year in sync with real calendar year (handles midnight rollovers)
  useEffect(() => {
    const checkYear = () => {
      const nowYear = new Date().getFullYear();
      setCurrentYear((prev) => (prev === nowYear ? prev : nowYear));
    };

    checkYear();
    const interval = setInterval(checkYear, 60 * 60 * 1000); // hourly check
    return () => clearInterval(interval);
  }, []);

  // Fetch activity data from API
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/activity?year=${activeYear}`);
        if (response.ok) {
          const { activity } = await response.json();
          setData(activity || []);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      fetchActivity();
    }
  }, [workspaceId, activeYear]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Mon", "", "Wed", "", "Fri", "", ""];

  // Generate all weeks for the year
  const weeks = useMemo(() => {
    const result: { date: Date; count: number; details?: Record<string, number> }[][] = [];
    const startDate = new Date(activeYear, 0, 1);
    const endDate = new Date(activeYear, 11, 31);
    
    // Adjust start to first Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    let currentWeek: { date: Date; count: number; details?: Record<string, number> }[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate || currentWeek.length > 0) {
      const dateStr = current.toISOString().split("T")[0];
      const activity = data.find(d => d.date === dateStr);
      
      currentWeek.push({
        date: new Date(current),
        count: activity?.count || 0,
        details: activity?.details,
      });
      
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
      
      if (current > endDate && currentWeek.length === 0) break;
    }
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return result;
  }, [data, activeYear]);

  // Get color intensity based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-[var(--workspace-sidebar-muted)]";
    if (count <= 2) return "bg-[var(--accent-primary)]/20";
    if (count <= 5) return "bg-[var(--accent-primary)]/40";
    if (count <= 10) return "bg-[var(--accent-primary)]/60";
    return "bg-[var(--accent-primary)]";  
  };

  // Calculate month positions
  const monthPositions = useMemo(() => {
    const positions: { month: string; position: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.date.getMonth() !== lastMonth) {
        lastMonth = firstDay.date.getMonth();
        positions.push({ month: months[lastMonth], position: weekIndex });
      }
    });
    
    return positions;
  }, [weeks]);

  const detailDefinitions = [
    { key: "uploads", label: "Upload", icon: ImageIcon },
    { key: "notes", label: "Note", icon: StickyNote },
    { key: "links", label: "Link", icon: Link2 },
    { key: "canvases", label: "Canvas", icon: LayoutTemplate },
    { key: "scratches", label: "Scratch", icon: Pencil },
  ] as const;

  // Calculate total activities
  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    const sortedDates = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (const item of sortedDates) {
      const itemDate = new Date(item.date);
      const diffDays = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streak && item.count > 0) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }
    return streak;
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl border border-[var(--workspace-sidebar-border)] p-5"
      style={{ backgroundColor: 'var(--workspace-sidebar)' }}
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-medium text-[var(--workspace-sidebar-muted-foreground)] uppercase tracking-wider">Activity Timeline</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold text-[var(--workspace-sidebar-foreground)]">{activeYear}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && totalActivities > 0 && (
              <div className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                <span className="text-[11px] font-medium text-[var(--accent-primary)]">{totalActivities} Activities</span>
              </div>
            )}
            {currentStreak > 0 && (
              <div className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-medium text-amber-400">🔥 {currentStreak} Days</span>
              </div>
            )}
          </div>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-[var(--workspace-sidebar-muted)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
              <span className="text-xs text-[var(--workspace-sidebar-muted-foreground)]">Loading activities...</span>
            </div>
          </div>
        )}
        
        {!loading && (
          <div className="space-y-2">
            {/* Month labels */}
            <div className="flex ml-8">
              {monthPositions.map(({ month, position }, i) => (
                <span
                  key={i}
                  className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)]"
                  style={{ 
                    marginLeft: i === 0 ? position * 14 : (position - (monthPositions[i - 1]?.position || 0)) * 14 - 24,
                    minWidth: 24,
                  }}
                >
                  {month}
                </span>
              ))}
            </div>

            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-2">
                {days.map((day, i) => (
                  <span key={i} className="text-[10px] text-[var(--workspace-sidebar-muted-foreground)] h-[11px] leading-[11px]">
                    {day}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-[11px] h-[11px] rounded-[3px] ${getColor(day.count)} transition-all duration-200 cursor-pointer hover:scale-110 hover:ring-1 hover:ring-[var(--accent-primary)]/50`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                            date: day.date,
                            count: day.count,
                            details: day.details,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip */}
            {isClient && tooltip &&
              createPortal(
                <div
                  className="fixed z-50 px-3 py-2 text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap min-w-[150px] border border-[var(--workspace-sidebar-border)]"
                  style={{ left: tooltip.x, top: tooltip.y, backgroundColor: 'var(--workspace-sidebar-muted)' }}
                >
                  <div className="font-medium text-[var(--workspace-sidebar-foreground)] mb-1">
                    {tooltip.date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  {tooltip.count === 0 ? (
                    <div className="text-[var(--workspace-sidebar-muted-foreground)]">No activity</div>
                  ) : (
                    <>
                      <div className="font-semibold text-[var(--accent-primary)]">
                        {tooltip.count} {tooltip.count === 1 ? "Activity" : "Activities"}
                      </div>
                      {tooltip.details && Object.keys(tooltip.details).length > 0 && (
                        <div className="mt-1.5 pt-1.5 border-t border-[var(--workspace-sidebar-border)] space-y-1 text-[var(--workspace-sidebar-foreground)]">
                          {detailDefinitions.map(({ key, label, icon: Icon }) => {
                            const value = tooltip.details?.[key as keyof typeof tooltip.details];
                            if (!value) return null;
                            const pluralSuffix = value !== 1 ? (label === "Canvas" || label === "Scratch" ? "es" : "s") : "";
                            return (
                              <div key={key} className="flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-[var(--workspace-sidebar-muted-foreground)]" />
                                <span>
                                  {value} {label}
                                  {pluralSuffix}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent" style={{ borderTopColor: 'var(--workspace-sidebar-muted)' }} />
                </div>,
                document.body
              )
            }

            {/* Legend */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--workspace-sidebar-border)]">
              <div className="text-[11px] text-[var(--workspace-sidebar-muted-foreground)]">
                {totalActivities > 0 ? `${Math.round(totalActivities / 12)} per month` : "No activity yet"}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[var(--workspace-sidebar-muted-foreground)]">
                <span>Less</span>
                <div className="flex gap-[2px]">
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--workspace-sidebar-muted)]" />
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--accent-primary)]/20" />
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--accent-primary)]/40" />
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--accent-primary)]/60" />
                  <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--accent-primary)]" />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
