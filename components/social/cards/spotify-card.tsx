"use client";

import { memo, useState, useRef } from "react";
import { SpotifyContent, CardTheme } from "@/lib/social/types";
import { formatDuration } from "@/lib/social/utils";
import { Play, Pause, Check } from "lucide-react";

interface SpotifyCardProps {
  content: SpotifyContent;
  theme?: CardTheme;
  showPreview?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const SPOTIFY_COLORS = {
  dark: {
    bg: '#121212',
    cardBg: '#181818',
    cardBgHover: '#282828',
    border: '#282828',
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    green: '#1DB954',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    cardBgHover: '#F5F5F5',
    border: '#E5E5E5',
    text: '#000000',
    textSecondary: '#6A6A6A',
    green: '#1DB954',
  },
};

function SpotifyCard({
  content,
  theme = 'dark',
  showPreview = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: SpotifyCardProps) {
  const colors = SPOTIFY_COLORS[theme === 'auto' ? 'dark' : theme];
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(content.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!content.previewUrl || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const contentTypeLabel = {
    track: 'Song',
    album: 'Album',
    playlist: 'Playlist',
    episode: 'Episode',
    show: 'Podcast',
    artist: 'Artist',
  };

  return (
    <div
      className={`rounded-lg overflow-hidden cursor-pointer transition-all relative group ${
        isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: isHovered ? colors.cardBgHover : colors.cardBg,
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

      <div className="p-4 flex gap-4">
        {/* Cover Image */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded overflow-hidden shadow-lg">
            {content.coverImage ? (
              <img
                src={content.coverImage}
                alt={content.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: colors.border }}
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" style={{ color: colors.green }} fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Play Button Overlay */}
          {showPreview && content.previewUrl && (
            <button
              onClick={handlePlayPause}
              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
                style={{ backgroundColor: colors.green }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black" fill="black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Type Label */}
          <span
            className="text-[11px] uppercase font-bold tracking-wide"
            style={{ color: colors.textSecondary }}
          >
            {contentTypeLabel[content.contentType]}
          </span>

          {/* Title */}
          <h3
            className="font-bold text-base mt-1 truncate"
            style={{ color: colors.text }}
          >
            {content.name}
          </h3>

          {/* Artists */}
          {content.artists && content.artists.length > 0 && (
            <p
              className="text-sm truncate mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              {content.artists.map(a => a.name).join(', ')}
            </p>
          )}

          {/* Album */}
          {content.album && (
            <p
              className="text-sm truncate"
              style={{ color: colors.textSecondary }}
            >
              {content.album.name}
            </p>
          )}

          {/* Duration & Explicit */}
          <div className="flex items-center gap-2 mt-1">
            {content.duration > 0 && (
              <span
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                {formatDuration(content.duration / 1000)}
              </span>
            )}
            {content.explicit && (
              <span
                className="text-[10px] px-1 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: colors.textSecondary,
                  color: colors.bg,
                }}
              >
                E
              </span>
            )}
          </div>
        </div>

        {/* Spotify Logo */}
        <div className="flex-shrink-0 self-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6" style={{ color: colors.green }} fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
      </div>

      {/* Audio Element */}
      {content.previewUrl && (
        <audio
          ref={audioRef}
          src={content.previewUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}

export default memo(SpotifyCard);
