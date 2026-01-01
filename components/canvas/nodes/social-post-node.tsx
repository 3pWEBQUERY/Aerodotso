"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useCanvasStore } from "@/lib/canvas/store";
import { SocialPost, SupportedPlatform, FetchError, CardTheme } from "@/lib/social/types";
import { detectPlatform, getPlatformInfo } from "@/lib/social/platform-detector";
import SocialCardRenderer from "@/components/social/social-card-renderer";
import { SocialCardSkeleton, SocialCardError } from "@/components/social/cards";

// Fetch social post through API to avoid CORS issues
async function fetchSocialPostViaAPI(url: string): Promise<SocialPost> {
  const response = await fetch('/api/social/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch post');
  }
  
  return response.json();
}
import { 
  RefreshCw, 
  ExternalLink, 
  Maximize2, 
  Minimize2,
  Trash2,
  Copy,
  MoreHorizontal,
} from "lucide-react";

export interface SocialPostNodeData {
  type: 'social-post';
  label: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  url: string;
  platform?: SupportedPlatform;
  postId?: string;
  post?: SocialPost;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: FetchError;
  displayMode: 'compact' | 'full' | 'expanded';
  theme: CardTheme;
  showMetrics: boolean;
  lastRefreshed?: Date;
}

function SocialPostNode({ id, data, selected }: NodeProps<SocialPostNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { updateNode, deleteNode, duplicateNode } = useCanvasStore();

  // Auto-fetch only on initial mount when URL exists and status is idle
  // Use a ref to track if we've already fetched for this URL
  const hasFetchedRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only fetch if:
    // 1. We have a URL
    // 2. Status is idle
    // 3. We haven't already fetched for this URL
    if (data.url && data.status === 'idle' && hasFetchedRef.current !== data.url) {
      hasFetchedRef.current = data.url;
      fetchAndUpdate();
    }
  }, [data.url, data.status]);

  const fetchAndUpdate = useCallback(async () => {
    if (!data.url) return;

    updateNode(id, { status: 'loading' } as Partial<SocialPostNodeData>);

    try {
      // Detect platform from URL
      const detected = detectPlatform(data.url);
      
      // Fetch post data via API to avoid CORS
      const post = await fetchSocialPostViaAPI(data.url);

      updateNode(id, {
        status: 'loaded',
        platform: detected?.platform || post.platform,
        postId: detected?.postId || post.id,
        post,
        lastRefreshed: new Date(),
        error: undefined,
      } as Partial<SocialPostNodeData>);
    } catch (error) {
      console.error('Failed to fetch social post:', error);
      updateNode(id, {
        status: 'error',
        error: {
          type: 'unknown',
          message: error instanceof Error ? error.message : 'Failed to load post',
          platform: data.platform || 'unknown',
        },
      } as Partial<SocialPostNodeData>);
    }
  }, [id, data.url, updateNode]);

  const handleRefresh = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Reset the ref to allow re-fetching
    hasFetchedRef.current = null;
    updateNode(id, { status: 'idle' } as Partial<SocialPostNodeData>);
  };

  const handleOpenOriginal = () => {
    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = data.displayMode === 'full' ? 'compact' : 'full';
    updateNode(id, { displayMode: newMode } as Partial<SocialPostNodeData>);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(id);
  };

  const platformInfo = data.platform ? getPlatformInfo(data.platform) : null;

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden transition-all duration-200
        ${selected ? "ring-2 ring-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles - outside card when selected */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-left-4 !opacity-100' : '!opacity-0'}`}
        style={{ top: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !bg-[var(--accent-primary)]/100 !border-2 !border-white transition-all duration-200 ${selected ? '!-right-4 !opacity-100' : '!opacity-0'}`}
        style={{ top: '50%' }}
      />

      {/* Node Controls (visible on hover) */}
      {isHovered && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center gap-1 z-10">
          <NodeControl
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleRefresh}
            tooltip="Refresh"
          />
          <NodeControl
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={handleOpenOriginal}
            tooltip="Open Original"
          />
          <NodeControl
            icon={data.displayMode === 'full' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            onClick={handleToggleSize}
            tooltip={data.displayMode === 'full' ? 'Compact' : 'Expand'}
          />
          <NodeControl
            icon={<Copy className="w-3.5 h-3.5" />}
            onClick={handleDuplicate}
            tooltip="Duplicate"
          />
          <NodeControl
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleDelete}
            tooltip="Delete"
            variant="danger"
          />
        </div>
      )}

      {/* Platform Badge removed per user request */}

      {/* Content - draggable except for interactive elements */}
      <div>
        {data.status === 'loading' && (
          <SocialCardSkeleton platform={data.platform} />
        )}

        {data.status === 'error' && data.error && (
          <SocialCardError
            error={data.error}
            url={data.url}
            onRetry={handleRefresh}
          />
        )}

        {data.status === 'loaded' && data.post && (
          <SocialCardRenderer
            post={data.post}
            displayMode={data.displayMode}
            theme={data.theme}
            showMetrics={data.showMetrics}
            onOpenOriginal={handleOpenOriginal}
          />
        )}

        {data.status === 'idle' && !data.url && (
          <div className="p-4 bg-gray-800 rounded-xl min-w-[280px]">
            <input
              type="text"
              placeholder="Paste social media URL here..."
              className="nodrag w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
              onPaste={(e) => {
                const pastedUrl = e.clipboardData.getData('text');
                if (pastedUrl) {
                  updateNode(id, { url: pastedUrl, status: 'idle' } as Partial<SocialPostNodeData>);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    updateNode(id, { url: input.value.trim(), status: 'idle' } as Partial<SocialPostNodeData>);
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Supports Twitter, YouTube, Instagram, TikTok, Spotify, Reddit, GitHub...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Node Control Button Component
function NodeControl({
  icon,
  onClick,
  tooltip,
  variant = 'default',
}: {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  tooltip: string;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1.5 rounded-lg transition-colors
        ${variant === 'danger' 
          ? 'bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400' 
          : 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white'
        }
      `}
      title={tooltip}
    >
      {icon}
    </button>
  );
}

export default memo(SocialPostNode);
