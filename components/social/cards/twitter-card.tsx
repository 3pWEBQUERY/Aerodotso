"use client";

import { memo } from "react";
import { TwitterPost, CardTheme } from "@/lib/social/types";
import { formatTwitterDate, formatCompactNumber, parseTwitterText } from "@/lib/social/utils";
import { BadgeCheck, MessageCircle, Repeat2, Heart, BarChart3, Share, Bookmark, Check } from "lucide-react";

interface TwitterCardProps {
  post: TwitterPost;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const TWITTER_COLORS = {
  dark: {
    bg: '#000000',
    cardBg: '#16181C',
    border: '#2F3336',
    text: '#E7E9EA',
    textSecondary: '#71767B',
    link: '#1D9BF0',
    verified: '#1D9BF0',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#EFF3F4',
    text: '#0F1419',
    textSecondary: '#536471',
    link: '#1D9BF0',
    verified: '#1D9BF0',
  },
};

function TwitterCard({ 
  post, 
  theme = 'dark', 
  showMetrics = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: TwitterCardProps) {
  const colors = TWITTER_COLORS[theme === 'auto' ? 'dark' : theme];
  const segments = parseTwitterText(post.content.text, post.content.entities);

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-gray-500/50 relative group ${
        isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        maxWidth: '550px',
        minWidth: '300px',
      }}
      onClick={handleCardClick}
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
          className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100"
              : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* Header: Avatar, Name, Handle, Verified Badge, X Logo */}
      <div className="flex items-start p-4 pb-0">
        {post.author.avatar ? (
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: colors.link }}
          >
            {post.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span
              className="font-bold truncate text-[15px]"
              style={{ color: colors.text }}
            >
              {post.author.name}
            </span>
            {post.author.verified && (
              <BadgeCheck 
                className="w-[18px] h-[18px] flex-shrink-0" 
                style={{ color: colors.verified }}
                fill={colors.verified}
                strokeWidth={0}
              />
            )}
          </div>
          <span
            className="text-[15px]"
            style={{ color: colors.textSecondary }}
          >
            @{post.author.handle}
          </span>
        </div>
        
        {/* X Logo */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-5 h-5 flex-shrink-0"
          style={{ color: colors.text }}
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p
          className="text-[15px] leading-5 whitespace-pre-wrap break-words"
          style={{ color: colors.text }}
        >
          {segments.map((segment, index) => {
            if (segment.type === 'text') {
              return <span key={index}>{segment.content}</span>;
            }
            if (segment.type === 'hashtag') {
              return (
                <a
                  key={index}
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: colors.link }}
                  onClick={(e) => e.stopPropagation()}
                >
                  #{segment.content}
                </a>
              );
            }
            if (segment.type === 'mention') {
              return (
                <a
                  key={index}
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: colors.link }}
                  onClick={(e) => e.stopPropagation()}
                >
                  @{segment.content}
                </a>
              );
            }
            if (segment.type === 'url') {
              return (
                <a
                  key={index}
                  href={segment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: colors.link }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {segment.content}
                </a>
              );
            }
            return null;
          })}
        </p>
      </div>

      {/* Media Grid */}
      {post.media && post.media.length > 0 && (
        <div className="px-4">
          <MediaGrid media={post.media} />
        </div>
      )}

      {/* Quoted Tweet */}
      {post.quotedPost && (
        <div className="mx-4 mt-3">
          <QuotedTweetCard post={post.quotedPost} theme={theme} />
        </div>
      )}

      {/* Timestamp */}
      <div className="px-4 py-3">
        <span
          className="text-[15px]"
          style={{ color: colors.textSecondary }}
        >
          {formatTwitterDate(post.createdAt)}
        </span>
      </div>

      {/* Divider */}
      <div
        className="mx-4 h-px"
        style={{ backgroundColor: colors.border }}
      />

      {/* Metrics */}
      {showMetrics && (
        <div className="px-4 py-3 flex gap-6">
          <MetricItem
            icon={<MessageCircle className="w-[18px] h-[18px]" />}
            count={post.metrics.comments}
            color={colors.textSecondary}
          />
          <MetricItem
            icon={<Repeat2 className="w-[18px] h-[18px]" />}
            count={post.metrics.retweets}
            color={colors.textSecondary}
          />
          <MetricItem
            icon={<Heart className="w-[18px] h-[18px]" />}
            count={post.metrics.likes}
            color={colors.textSecondary}
          />
          <MetricItem
            icon={<BarChart3 className="w-[18px] h-[18px]" />}
            count={post.metrics.views}
            color={colors.textSecondary}
          />
          <div className="flex-1" />
          <div className="flex gap-3" style={{ color: colors.textSecondary }}>
            <Bookmark className="w-[18px] h-[18px]" />
            <Share className="w-[18px] h-[18px]" />
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Item Component
function MetricItem({ 
  icon, 
  count, 
  color 
}: { 
  icon: React.ReactNode; 
  count?: number; 
  color: string;
}) {
  return (
    <div 
      className="flex items-center gap-1 text-[13px]"
      style={{ color }}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span>{formatCompactNumber(count)}</span>
      )}
    </div>
  );
}

// Media Grid Component
function MediaGrid({ media }: { media: TwitterPost['media'] }) {
  if (!media || media.length === 0) return null;

  const gridClass = media.length === 1 
    ? 'grid-cols-1' 
    : media.length === 2 
      ? 'grid-cols-2' 
      : media.length === 3 
        ? 'grid-cols-2' 
        : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-0.5 rounded-2xl overflow-hidden`}>
      {media.slice(0, 4).map((item, index) => (
        <div 
          key={index} 
          className={`relative ${
            media.length === 3 && index === 0 ? 'row-span-2' : ''
          }`}
          style={{ 
            aspectRatio: media.length === 1 ? '16/9' : '1/1',
          }}
        >
          {item.type === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <img 
                src={item.thumbnailUrl || item.url} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={item.url}
              alt={item.altText || ''}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Quoted Tweet Card (simplified version)
function QuotedTweetCard({ 
  post, 
  theme 
}: { 
  post: TwitterPost; 
  theme: CardTheme;
}) {
  const colors = TWITTER_COLORS[theme === 'auto' ? 'dark' : theme];

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: 'transparent',
        borderColor: colors.border,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {post.author.avatar ? (
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <div 
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: colors.link }}
          >
            {post.author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-bold text-sm" style={{ color: colors.text }}>
          {post.author.name}
        </span>
        {post.author.verified && (
          <BadgeCheck 
            className="w-4 h-4" 
            style={{ color: colors.verified }}
            fill={colors.verified}
            strokeWidth={0}
          />
        )}
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          @{post.author.handle}
        </span>
      </div>
      <p 
        className="text-sm line-clamp-3"
        style={{ color: colors.text }}
      >
        {post.content.text}
      </p>
    </div>
  );
}

export default memo(TwitterCard);
