"use client";

import { memo } from "react";
import { RedditPost, CardTheme } from "@/lib/social/types";
import { formatRelativeTime, formatCompactNumber } from "@/lib/social/utils";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Share2, Bookmark, Award, ExternalLink, Check } from "lucide-react";

interface RedditCardProps {
  post: RedditPost;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const REDDIT_COLORS = {
  dark: {
    bg: '#0B1416',
    cardBg: '#1A1A1B',
    border: '#343536',
    text: '#D7DADC',
    textSecondary: '#818384',
    orange: '#FF4500',
    link: '#4FBCFF',
    upvote: '#FF4500',
    downvote: '#7193FF',
  },
  light: {
    bg: '#DAE0E6',
    cardBg: '#FFFFFF',
    border: '#EDEFF1',
    text: '#1C1C1C',
    textSecondary: '#787C7E',
    orange: '#FF4500',
    link: '#0079D3',
    upvote: '#FF4500',
    downvote: '#7193FF',
  },
};

function RedditCard({
  post,
  theme = 'dark',
  showMetrics = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: RedditCardProps) {
  const colors = REDDIT_COLORS[theme === 'auto' ? 'dark' : theme];

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`rounded-lg border overflow-hidden cursor-pointer hover:border-gray-500/50 transition-colors relative group ${
        isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        maxWidth: '600px',
        minWidth: '320px',
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

      <div className="flex">
        {/* Vote Column */}
        {showMetrics && (
          <div
            className="flex flex-col items-center py-2 px-2 gap-1"
            style={{ backgroundColor: theme === 'dark' ? '#161617' : '#F8F9FA' }}
          >
            <ArrowBigUp
              className="w-6 h-6 cursor-pointer hover:text-orange-500"
              style={{ color: colors.textSecondary }}
            />
            <span
              className="text-xs font-bold"
              style={{ color: colors.orange }}
            >
              {formatCompactNumber(post.metrics.upvotes)}
            </span>
            <ArrowBigDown
              className="w-6 h-6 cursor-pointer hover:text-blue-500"
              style={{ color: colors.textSecondary }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3">
          {/* Header */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Subreddit Icon */}
            {post.subreddit.icon ? (
              <img
                src={post.subreddit.icon}
                alt={post.subreddit.name}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.orange }}
              >
                <span className="text-white text-[10px] font-bold">r/</span>
              </div>
            )}
            <span className="font-bold" style={{ color: colors.text }}>
              {post.subreddit.displayName}
            </span>
            <span style={{ color: colors.textSecondary }}>•</span>
            <span style={{ color: colors.textSecondary }}>
              Posted by u/{post.author.handle}
            </span>
            <span style={{ color: colors.textSecondary }}>
              {formatRelativeTime(post.createdAt)}
            </span>
            
            {/* Badges */}
            {post.isNSFW && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 uppercase">
                NSFW
              </span>
            )}
            {post.isSpoiler && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400 uppercase">
                Spoiler
              </span>
            )}
          </div>

          {/* Flair */}
          {post.content.flair && (
            <span
              className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: post.content.flair.backgroundColor || colors.orange,
                color: '#FFFFFF',
              }}
            >
              {post.content.flair.text}
            </span>
          )}

          {/* Title */}
          <h3
            className="font-medium text-lg mt-2 leading-tight"
            style={{ color: colors.text }}
          >
            {post.content.title}
          </h3>

          {/* Self Text Preview */}
          {post.content.selftext && (
            <p
              className="mt-2 text-sm line-clamp-3"
              style={{ color: colors.textSecondary }}
            >
              {post.content.selftext}
            </p>
          )}

          {/* Media Preview */}
          {post.media && post.media.length > 0 && post.media[0].url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              {post.media[0].type === 'video' ? (
                <div className="relative aspect-video bg-black">
                  <img
                    src={post.media[0].thumbnailUrl || post.media[0].url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-800 ml-1" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={post.media[0].url}
                  alt=""
                  className="w-full max-h-[400px] object-contain bg-black"
                />
              )}
            </div>
          )}

          {/* Awards */}
          {post.metrics.awards && post.metrics.awards.length > 0 && (
            <div className="flex items-center gap-1 mt-3">
              {post.metrics.awards.slice(0, 5).map((award, index) => (
                <div key={index} className="flex items-center">
                  {award.icon ? (
                    <img src={award.icon} alt={award.name} className="w-4 h-4" />
                  ) : (
                    <Award className="w-4 h-4" style={{ color: '#FFD700' }} />
                  )}
                  {award.count > 1 && (
                    <span className="text-xs ml-0.5" style={{ color: colors.textSecondary }}>
                      {award.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3">
            <div
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: colors.textSecondary }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{formatCompactNumber(post.metrics.comments)} Comments</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: colors.textSecondary }}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </div>
            <div
              className="flex items-center gap-1 text-xs font-bold"
              style={{ color: colors.textSecondary }}
            >
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </div>
          </div>
        </div>

        {/* Reddit Logo */}
        <div className="p-3">
          <svg viewBox="0 0 20 20" className="w-5 h-5" style={{ color: colors.orange }} fill="currentColor">
            <path d="M16.5 8.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5c-.6 0-1.12.36-1.36.88a7.51 7.51 0 0 0-3.5-.88l.66-3.12 2.16.45c.05.66.6 1.17 1.27 1.17.7 0 1.27-.57 1.27-1.27S16.43 1.5 15.73 1.5c-.52 0-.96.31-1.16.75l-2.4-.5a.5.5 0 0 0-.58.37l-.78 3.73a7.46 7.46 0 0 0-3.67.94A1.75 1.75 0 0 0 5.5 5.5C4.67 5.5 4 6.17 4 7c0 .6.36 1.12.88 1.36-.08.32-.13.66-.13 1.01 0 3.03 3.58 5.5 8 5.5s8-2.47 8-5.5c0-.35-.05-.69-.13-1.01.52-.24.88-.76.88-1.36zM7 10.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6.24 2.64c-.78.78-2.02 1.16-3.24 1.16-1.22 0-2.46-.38-3.24-1.16a.5.5 0 0 1 .71-.71c.56.56 1.5.87 2.53.87s1.97-.31 2.53-.87a.5.5 0 0 1 .71.71zM13 10.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default memo(RedditCard);
