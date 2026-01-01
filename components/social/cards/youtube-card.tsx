"use client";

import { memo, useState } from "react";
import { YouTubeVideo, CardTheme } from "@/lib/social/types";
import { formatYouTubeDuration, formatViewCount, formatRelativeTime, formatCompactNumber } from "@/lib/social/utils";
import { Play, BadgeCheck, Check } from "lucide-react";

interface YouTubeCardProps {
  video: YouTubeVideo;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const YOUTUBE_COLORS = {
  dark: {
    bg: '#0F0F0F',
    cardBg: '#272727',
    border: '#3F3F3F',
    text: '#F1F1F1',
    textSecondary: '#AAAAAA',
    red: '#FF0000',
    link: '#3EA6FF',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#E5E5E5',
    text: '#0F0F0F',
    textSecondary: '#606060',
    red: '#FF0000',
    link: '#065FD4',
  },
};

function YouTubeCard({
  video,
  theme = 'dark',
  showMetrics = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: YouTubeCardProps) {
  const colors = YOUTUBE_COLORS[theme === 'auto' ? 'dark' : theme];
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const thumbnailUrl = imageError 
    ? video.thumbnail.high 
    : video.thumbnail.maxres || video.thumbnail.high;

  return (
    <div
      className={`rounded-xl overflow-hidden cursor-pointer transition-all relative group ${
        isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: colors.cardBg,
        maxWidth: '400px',
        minWidth: '280px',
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
          className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white opacity-100"
              : "bg-white/80 border-gray-300 hover:border-[var(--accent-primary)] opacity-0 group-hover:opacity-100"
          }`}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* Thumbnail with Duration & Play Button */}
      <div className="relative aspect-video bg-black">
        <img
          src={thumbnailUrl}
          alt={video.content.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* Duration Badge */}
        {video.duration && !video.isLive && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatYouTubeDuration(video.duration)}
          </div>
        )}

        {/* Live Badge */}
        {video.isLive && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded uppercase tracking-wide">
            Live
          </div>
        )}

        {/* Shorts Badge */}
        {video.isShort && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
              <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zM10 14.65v-5.3L15 12l-5 2.65z" />
            </svg>
            Shorts
          </div>
        )}

        {/* Play Button Overlay on Hover */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 0, 0, 0.9)' }}
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex gap-3">
        {/* Channel Avatar */}
        {video.author.avatar ? (
          <img
            src={video.author.avatar}
            alt={video.author.name}
            className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div 
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: colors.red }}
          >
            {video.author.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className="font-medium text-sm line-clamp-2 leading-5"
            style={{ color: colors.text }}
          >
            {video.content.title}
          </h3>

          {/* Channel Name */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-xs truncate"
              style={{ color: colors.textSecondary }}
            >
              {video.author.name}
            </span>
            {video.author.verified && (
              <BadgeCheck 
                className="w-3.5 h-3.5 flex-shrink-0" 
                style={{ color: colors.textSecondary }}
              />
            )}
          </div>

          {/* View Count & Date */}
          {showMetrics && (
            <div
              className="text-xs mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              {formatCompactNumber(video.metrics.views)} views • {formatRelativeTime(video.publishedAt)}
            </div>
          )}
        </div>

        {/* YouTube Logo */}
        <svg 
          viewBox="0 0 90 20" 
          className="w-[72px] h-4 flex-shrink-0 mt-0.5"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <path 
              d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 2.24288e-07 14.285 0 14.285 0C14.285 0 5.35042 2.24288e-07 3.12323 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C2.24288e-07 5.35042 0 10 0 10C0 10 2.24288e-07 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12323 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5677 5.35042 27.9727 3.12324Z" 
              fill="#FF0000"
            />
            <path 
              d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" 
              fill="white"
            />
            <path 
              d="M34.6024 19.4526V1.54199H37.6024V19.4526H34.6024Z" 
              fill={colors.text}
            />
            <path 
              d="M47.5566 6.19759V19.4526H44.7066V17.8024H44.6266C43.9733 19.0624 42.7666 19.7726 41.2133 19.7726C38.8266 19.7726 37.1733 17.9759 37.1733 14.8326V6.19759H40.0233V14.2859C40.0233 16.2459 40.9533 17.2959 42.6066 17.2959C44.2599 17.2959 44.7066 15.8059 44.7066 14.0359V6.19759H47.5566Z" 
              fill={colors.text}
            />
            <path 
              d="M56.1533 17.2959C57.7533 17.2959 58.8799 16.0359 58.8799 13.9259V11.7259C58.8799 9.61592 57.7533 8.35592 56.1533 8.35592C54.5533 8.35592 53.4266 9.61592 53.4266 11.7259V13.9259C53.4266 16.0359 54.5533 17.2959 56.1533 17.2959ZM50.5766 11.7259C50.5766 8.05592 52.8533 5.87759 56.1533 5.87759C59.4533 5.87759 61.7299 8.05592 61.7299 11.7259V13.9259C61.7299 17.5959 59.4533 19.7726 56.1533 19.7726C52.8533 19.7726 50.5766 17.5959 50.5766 13.9259V11.7259Z" 
              fill={colors.text}
            />
            <path 
              d="M70.9468 8.67592H67.2768V19.4526H64.4268V8.67592H62.7735V6.19759H64.4268V4.89759C64.4268 2.37759 65.8468 0.921921 68.5835 0.921921C69.2101 0.921921 69.8101 0.998588 70.2568 1.10192V3.57759C69.9035 3.50092 69.4835 3.45092 69.0368 3.45092C67.8568 3.45092 67.2768 4.03092 67.2768 5.21092V6.19759H70.9468V8.67592Z" 
              fill={colors.text}
            />
            <path 
              d="M79.2501 17.3226C80.8501 17.3226 81.9768 16.0626 81.9768 13.9526V11.6993C81.9768 9.58926 80.8501 8.32926 79.2501 8.32926C77.6501 8.32926 76.5234 9.58926 76.5234 11.6993V13.9526C76.5234 16.0626 77.6501 17.3226 79.2501 17.3226ZM73.6734 11.6993C73.6734 8.02926 75.9501 5.85092 79.2501 5.85092C82.5501 5.85092 84.8268 8.02926 84.8268 11.6993V13.9526C84.8268 17.6226 82.5501 19.7993 79.2501 19.7993C75.9501 19.7993 73.6734 17.6226 73.6734 13.9526V11.6993Z" 
              fill={colors.text}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default memo(YouTubeCard);
