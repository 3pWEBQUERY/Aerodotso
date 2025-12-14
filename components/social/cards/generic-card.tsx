"use client";

import { memo } from "react";
import { GenericSocialPost, CardTheme } from "@/lib/social/types";
import { extractDomain } from "@/lib/social/utils";
import { Globe, ExternalLink } from "lucide-react";

interface GenericCardProps {
  post: GenericSocialPost;
  theme?: CardTheme;
  onOpenOriginal?: () => void;
}

const GENERIC_COLORS = {
  dark: {
    bg: '#1A1A1A',
    cardBg: '#262626',
    border: '#404040',
    text: '#FFFFFF',
    textSecondary: '#999999',
    link: '#60A5FA',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#E5E5E5',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    link: '#2563EB',
  },
};

function GenericCard({
  post,
  theme = 'dark',
  onOpenOriginal,
}: GenericCardProps) {
  const colors = GENERIC_COLORS[theme === 'auto' ? 'dark' : theme];
  const domain = extractDomain(post.url);
  const og = post.openGraph;

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        maxWidth: '500px',
        minWidth: '280px',
      }}
      onClick={handleCardClick}
    >
      {/* Image */}
      {og.image && (
        <div className="relative aspect-[1.91/1] bg-gray-900">
          <img
            src={og.image}
            alt={og.title || ''}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Site Name */}
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4" style={{ color: colors.textSecondary }} />
          <span
            className="text-xs uppercase tracking-wide font-medium"
            style={{ color: colors.textSecondary }}
          >
            {og.siteName || domain}
          </span>
        </div>

        {/* Title */}
        {og.title && (
          <h3
            className="font-semibold text-base leading-tight line-clamp-2"
            style={{ color: colors.text }}
          >
            {og.title}
          </h3>
        )}

        {/* Description */}
        {og.description && (
          <p
            className="text-sm mt-2 line-clamp-2"
            style={{ color: colors.textSecondary }}
          >
            {og.description}
          </p>
        )}

        {/* Author */}
        {og.author && (
          <p
            className="text-xs mt-2"
            style={{ color: colors.textSecondary }}
          >
            By {og.author}
          </p>
        )}

        {/* URL */}
        <div className="flex items-center gap-1 mt-3">
          <ExternalLink className="w-3 h-3" style={{ color: colors.link }} />
          <span
            className="text-xs truncate"
            style={{ color: colors.link }}
          >
            {domain}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(GenericCard);
