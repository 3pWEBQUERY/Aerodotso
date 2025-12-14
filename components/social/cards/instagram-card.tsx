"use client";

import { memo, useState } from "react";
import { InstagramPost, CardTheme } from "@/lib/social/types";
import { formatRelativeTime, formatCompactNumber } from "@/lib/social/utils";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, ChevronLeft, ChevronRight, Play, Check } from "lucide-react";

interface InstagramCardProps {
  post: InstagramPost;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const INSTAGRAM_COLORS = {
  dark: {
    bg: '#000000',
    cardBg: '#000000',
    border: '#262626',
    text: '#F5F5F5',
    textSecondary: '#A8A8A8',
    gradient: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#DBDBDB',
    text: '#262626',
    textSecondary: '#8E8E8E',
    gradient: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
  },
};

function InstagramCard({
  post,
  theme = 'dark',
  showMetrics = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: InstagramCardProps) {
  const colors = INSTAGRAM_COLORS[theme === 'auto' ? 'dark' : theme];
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => Math.min(post.media.length - 1, prev + 1));
  };

  const hasMultipleMedia = post.media.length > 1;
  const currentMedia = post.media[currentMediaIndex];

  return (
    <div
      className={`border rounded-lg overflow-hidden cursor-pointer relative group ${
        isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        maxWidth: '470px',
        minWidth: '320px',
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      {onCheckboxClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCheckboxClick();
          }}
          className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-emerald-600 border-emerald-600 text-white opacity-100"
              : "bg-white/80 border-gray-300 hover:border-emerald-500 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* Header */}
      <div className="flex items-center p-3">
        {/* Avatar with Story Ring */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full p-[2px]"
            style={{ background: colors.gradient }}
          >
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-full h-full rounded-full object-cover"
                style={{ border: `2px solid ${colors.bg}` }}
              />
            ) : (
              <div 
                className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ 
                  backgroundColor: '#E4405F',
                  border: `2px solid ${colors.bg}` 
                }}
              >
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="ml-3 flex-1">
          <div className="flex items-center gap-1">
            <span
              className="font-semibold text-sm"
              style={{ color: colors.text }}
            >
              {post.author.handle}
            </span>
            {post.author.verified && (
              <BadgeCheck
                className="w-3.5 h-3.5"
                style={{ color: '#3897F0' }}
                fill="#3897F0"
                strokeWidth={0}
              />
            )}
          </div>
          {post.location && (
            <span
              className="text-xs"
              style={{ color: colors.text }}
            >
              {post.location.name}
            </span>
          )}
        </div>

        <MoreHorizontal
          className="w-6 h-6 cursor-pointer"
          style={{ color: colors.text }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Media */}
      <div className="relative">
        {currentMedia ? (
          <div
            className="relative w-full bg-black"
            style={{
              aspectRatio:
                currentMedia.width && currentMedia.height
                  ? `${currentMedia.width} / ${currentMedia.height}`
                  : '4 / 5',
            }}
          >
            <img
              src={
                currentMedia.type === 'video'
                  ? currentMedia.thumbnailUrl || currentMedia.url
                  : currentMedia.url
              }
              alt={currentMedia.altText || post.content.caption || ''}
              className="absolute inset-0 w-full h-full !object-contain"
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />

            {currentMedia.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}

            {currentMedia.type === 'video' && post.postType === 'reel' && (
              <div className="absolute top-3 right-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12.823 1l2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1h4.272zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 011.596 2.82l.07.295h-4.629L15.15 1zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 013.942-4.53zm9.735 12.834l-4.545-2.624a.909.909 0 00-1.356.668l-.008.12v5.248a.91.91 0 001.255.84l.109-.053 4.545-2.624a.909.909 0 00.1-1.507l-.1-.068-4.545-2.624zm-14.2-6.209h21.964v12.001c0 3.378-1.68 5.406-4.817 5.933l-.267.04-.305.03-.318.021-.335.013-.357.006H6.014l-.357-.006-.335-.014-.318-.02-.305-.031-.267-.04c-3.138-.527-4.817-2.555-4.817-5.933V8.002z" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full aspect-[4/5] flex items-center justify-center"
            style={{ backgroundColor: colors.border }}
          >
            <svg viewBox="0 0 24 24" className="w-12 h-12 opacity-30" fill="currentColor" style={{ color: colors.text }}>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
        )}

        {/* Carousel Navigation */}
        {hasMultipleMedia && isHovered && (
          <>
            {currentMediaIndex > 0 && (
              <button
                onClick={handlePrevMedia}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
            )}
            {currentMediaIndex < post.media.length - 1 && (
              <button
                onClick={handleNextMedia}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            )}
          </>
        )}

        {/* Carousel Indicators */}
        {hasMultipleMedia && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {post.media.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentMediaIndex ? 'bg-blue-500' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Multiple Photos Icon */}
        {hasMultipleMedia && (
          <div className="absolute top-3 right-3">
            <svg viewBox="0 0 48 48" className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor">
              <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-4">
          <Heart 
            className="w-6 h-6 cursor-pointer hover:opacity-50 transition-opacity" 
            style={{ color: colors.text }} 
          />
          <MessageCircle 
            className="w-6 h-6 cursor-pointer hover:opacity-50 transition-opacity" 
            style={{ color: colors.text }} 
          />
          <Send 
            className="w-6 h-6 cursor-pointer hover:opacity-50 transition-opacity" 
            style={{ color: colors.text }} 
          />
          <div className="flex-1" />
          <Bookmark 
            className="w-6 h-6 cursor-pointer hover:opacity-50 transition-opacity" 
            style={{ color: colors.text }} 
          />
        </div>

        {/* Likes */}
        {showMetrics && post.metrics.likes !== undefined && post.metrics.likes > 0 && (
          <div className="mt-2">
            <span
              className="font-semibold text-sm"
              style={{ color: colors.text }}
            >
              {formatCompactNumber(post.metrics.likes)} likes
            </span>
          </div>
        )}

        {/* Caption */}
        {post.content.caption && (
          <div className="mt-1">
            <span
              className="font-semibold text-sm mr-1"
              style={{ color: colors.text }}
            >
              {post.author.handle}
            </span>
            <span
              className="text-sm"
              style={{ color: colors.text }}
            >
              {post.content.caption.length > 125
                ? `${post.content.caption.slice(0, 125)}...`
                : post.content.caption}
            </span>
          </div>
        )}

        {/* Comments Preview */}
        {showMetrics && post.metrics.comments !== undefined && post.metrics.comments > 0 && (
          <button
            className="text-sm mt-1"
            style={{ color: colors.textSecondary }}
          >
            View all {formatCompactNumber(post.metrics.comments)} comments
          </button>
        )}

        {/* Timestamp */}
        <div
          className="text-[10px] uppercase mt-2"
          style={{ color: colors.textSecondary }}
        >
          {formatRelativeTime(post.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default memo(InstagramCard);
