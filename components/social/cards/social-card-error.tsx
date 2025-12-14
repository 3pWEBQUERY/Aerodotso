"use client";

import { memo } from "react";
import { FetchError, SupportedPlatform } from "@/lib/social/types";
import { AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface SocialCardErrorProps {
  error: FetchError;
  url: string;
  onRetry?: () => void;
}

const ERROR_MESSAGES: Record<FetchError['type'], string> = {
  not_found: "This post has been deleted or doesn't exist.",
  private: "This is a private post and cannot be displayed.",
  rate_limited: "Too many requests. Please try again later.",
  network: "Network error. Check your connection.",
  unsupported: "This content type is not yet supported.",
  auth_required: "Authentication required to access this content.",
  unknown: "Something went wrong loading this post.",
};

function SocialCardError({ error, url, onRetry }: SocialCardErrorProps) {
  const canRetry = error.type !== 'not_found' && error.type !== 'private' && error.type !== 'unsupported';

  return (
    <div 
      className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
      style={{
        maxWidth: '400px',
        minWidth: '280px',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-300 font-medium">
            {error.message || ERROR_MESSAGES[error.type]}
          </p>
          
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            Open original link
          </a>
        </div>

        {canRetry && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1 text-xs text-red-300 hover:text-red-200 px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(SocialCardError);
