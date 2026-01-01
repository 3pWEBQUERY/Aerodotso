"use client";

import { Check, Star, PanelRight, StickyNote, Image as ImageIcon, FileText, CheckSquare } from "lucide-react";
import Link from "next/link";

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface CanvasCardProps {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  isStarred?: boolean;
  isSelected?: boolean;
  workspaceId: string;
  onSelect?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onStar?: () => void;
  onOpenInPanel?: () => void;
  canvasData?: {
    nodes?: CanvasNode[];
    edges?: any[];
  };
}

export function CanvasCard({
  id,
  name,
  isStarred = false,
  isSelected = false,
  workspaceId,
  onSelect,
  onDelete,
  canvasData,
  onStar,
  onOpenInPanel,
}: CanvasCardProps) {
  const nodes = canvasData?.nodes || [];
  
  // Calculate bounds for scaling - consider actual node sizes
  const getNodeSize = (node: CanvasNode) => {
    const w = node.data?.nodeWidth || (node.type === 'image' ? 200 : node.type === 'note' ? 240 : 180);
    const h = node.data?.nodeHeight || (node.type === 'image' ? 150 : node.type === 'note' ? 320 : 140);
    return { w, h };
  };
  
  const getBounds = () => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const size = getNodeSize(node);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + size.w);
      maxY = Math.max(maxY, node.position.y + size.h);
    });
    
    // Add padding
    const padding = 40;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  };
  
  const bounds = getBounds();
  // Scale to fit in card (320x180 usable area)
  const cardWidth = 280;
  const cardHeight = 160;
  const scale = Math.min(cardWidth / bounds.width, cardHeight / bounds.height, 0.4);
  
  // Get node color based on type
  const getNodeStyle = (node: CanvasNode) => {
    switch (node.type) {
      case 'note':
        return { bg: 'bg-white', border: 'border-gray-300', icon: StickyNote };
      case 'postit':
        const postitColors: Record<string, string> = {
          green: 'bg-green-200',
          yellow: 'bg-yellow-100',
          pink: 'bg-pink-200',
          blue: 'bg-blue-200',
          orange: 'bg-orange-200',
          purple: 'bg-purple-200',
        };
        return { bg: postitColors[node.data?.backgroundColor] || 'bg-green-200', border: 'border-green-400', icon: CheckSquare };
      case 'image':
        return { bg: 'bg-gray-100', border: 'border-gray-300', icon: ImageIcon };
      case 'document':
        return { bg: 'bg-blue-50', border: 'border-blue-300', icon: FileText };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', icon: FileText };
    }
  };

  return (
    <div className="group relative">
      <Link
        href={`/workspace/${workspaceId}/canvas/${id}`}
        className={`
          block h-56 rounded-[18px] border bg-white
          overflow-hidden transition-all duration-200 cursor-pointer
          relative
          ${isSelected ? "ring-2 ring-[var(--accent-primary)]" : ""}
        `}
      >
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        
        {/* Canvas Preview - Miniature nodes */}
        {nodes.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div 
              className="relative"
              style={{
                width: bounds.width,
                height: bounds.height,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              {nodes.slice(0, 20).map((node) => {
                const style = getNodeStyle(node);
                const Icon = style.icon;
                const size = getNodeSize(node);
                const x = node.position.x - bounds.minX;
                const y = node.position.y - bounds.minY;
                
                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-lg ${style.bg} ${style.border} border-2 shadow-md overflow-hidden`}
                    style={{
                      left: x,
                      top: y,
                      width: size.w,
                      height: size.h,
                    }}
                  >
                    {node.type === 'image' && node.data?.url ? (
                      <img 
                        src={node.data.url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-3 flex flex-col gap-2 h-full">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate font-medium">
                            {node.data?.label || node.type}
                          </span>
                        </div>
                        {node.type === 'note' && node.data?.content && (
                          <p className="text-xs text-gray-500 line-clamp-4 flex-1">
                            {node.data.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                          </p>
                        )}
                        {node.type === 'postit' && node.data?.items && (
                          <div className="space-y-1 flex-1">
                            {node.data.items.slice(0, 4).map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5">
                                {item.isCheckbox !== false && (
                                  <div className={`w-3 h-3 rounded border ${item.checked ? 'bg-gray-700 border-gray-700' : 'border-gray-500'}`} />
                                )}
                                <span className="text-xs text-gray-700 truncate">{item.text || 'Click to edit...'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent" />

        {/* Selection checkbox */}
        <button
          type="button"
          className={`
            absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
            ${isSelected
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100"
              : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
            }
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onSelect) {
              onSelect(e);
            }
          }}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>

        {/* Star indicator */}
        {isStarred && (
          <div className="absolute top-3 right-3 z-20">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
        )}

        {/* Open in panel button */}
        {onOpenInPanel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenInPanel();
            }}
            className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Open in side panel"
          >
            <PanelRight className="h-3.5 w-3.5 text-gray-600" />
          </button>
        )}

        {/* Title Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/30 border border-slate-200 shadow-sm backdrop-blur-sm">
            <div className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white border border-slate-200 text-[11px] leading-none text-slate-500 font-medium">
              ⌘
            </div>
            <span className="text-xs font-medium text-slate-600 truncate max-w-[160px]">
              {name || "Untitled Canvas"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
