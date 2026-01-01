"use client";

import { memo } from "react";
import { GitHubRepo, CardTheme } from "@/lib/social/types";
import { formatCompactNumber, formatRelativeTime } from "@/lib/social/utils";
import { Star, GitFork, Eye, Circle, Scale, Check } from "lucide-react";

interface GitHubCardProps {
  repo: GitHubRepo;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
  isSelected?: boolean;
  onCheckboxClick?: () => void;
}

const GITHUB_COLORS = {
  dark: {
    bg: '#0D1117',
    cardBg: '#161B22',
    border: '#30363D',
    text: '#E6EDF3',
    textSecondary: '#8B949E',
    link: '#58A6FF',
    green: '#238636',
  },
  light: {
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    border: '#D0D7DE',
    text: '#1F2328',
    textSecondary: '#656D76',
    link: '#0969DA',
    green: '#1A7F37',
  },
};

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#F1E05A',
  TypeScript: '#3178C6',
  Python: '#3572A5',
  Java: '#B07219',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  PHP: '#4F5D95',
  HTML: '#E34C26',
  CSS: '#563D7C',
  SCSS: '#C6538C',
  Vue: '#41B883',
  Svelte: '#FF3E00',
  Shell: '#89E051',
  Dart: '#00B4AB',
  Elixir: '#6E4A7E',
  Scala: '#C22D40',
  Haskell: '#5E5086',
  Lua: '#000080',
  R: '#198CE7',
  Julia: '#A270BA',
};

function GitHubCard({
  repo,
  theme = 'dark',
  showMetrics = true,
  onOpenOriginal,
  isSelected = false,
  onCheckboxClick,
}: GitHubCardProps) {
  const colors = GITHUB_COLORS[theme === 'auto' ? 'dark' : theme];
  const languageColor = repo.language ? LANGUAGE_COLORS[repo.language] || colors.textSecondary : null;

  const handleCardClick = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(repo.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`rounded-md border overflow-hidden cursor-pointer hover:border-blue-500/50 transition-colors relative group ${
        isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
      }`}
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        maxWidth: '500px',
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

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Owner Avatar */}
          {repo.owner.avatar ? (
            <img
              src={repo.owner.avatar}
              alt={repo.owner.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <span style={{ color: colors.text }} className="text-sm font-medium">
                {repo.owner.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Repo Name */}
            <div className="flex items-center gap-2">
              <a
                className="text-sm font-semibold hover:underline truncate"
                style={{ color: colors.link }}
                onClick={(e) => e.stopPropagation()}
              >
                {repo.owner.name}
              </a>
              <span style={{ color: colors.textSecondary }}>/</span>
              <a
                className="text-sm font-semibold hover:underline truncate"
                style={{ color: colors.link }}
                onClick={(e) => e.stopPropagation()}
              >
                {repo.name}
              </a>
            </div>

            {/* Visibility Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  color: colors.textSecondary,
                  borderColor: colors.border,
                }}
              >
                {repo.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
          </div>

          {/* GitHub Logo */}
          <svg
            viewBox="0 0 16 16"
            className="w-5 h-5 flex-shrink-0"
            style={{ color: colors.text }}
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </div>

        {/* Description */}
        {repo.description && (
          <p
            className="text-sm mt-3 line-clamp-2"
            style={{ color: colors.textSecondary }}
          >
            {repo.description}
          </p>
        )}

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {repo.topics.slice(0, 5).map((topic) => (
              <span
                key={topic}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${colors.link}20`,
                  color: colors.link,
                }}
              >
                {topic}
              </span>
            ))}
            {repo.topics.length > 5 && (
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${colors.textSecondary}20`,
                  color: colors.textSecondary,
                }}
              >
                +{repo.topics.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Stats Row */}
        {showMetrics && (
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: colors.textSecondary }}>
            {/* Language */}
            {repo.language && (
              <div className="flex items-center gap-1.5">
                <Circle
                  className="w-3 h-3"
                  fill={languageColor || 'currentColor'}
                  stroke="none"
                />
                <span>{repo.language}</span>
              </div>
            )}

            {/* Stars */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{formatCompactNumber(repo.metrics.stars)}</span>
            </div>

            {/* Forks */}
            <div className="flex items-center gap-1">
              <GitFork className="w-4 h-4" />
              <span>{formatCompactNumber(repo.metrics.forks)}</span>
            </div>

            {/* Watchers */}
            {repo.metrics.watchers > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{formatCompactNumber(repo.metrics.watchers)}</span>
              </div>
            )}

            {/* License */}
            {repo.license && (
              <div className="flex items-center gap-1">
                <Scale className="w-4 h-4" />
                <span>{repo.license}</span>
              </div>
            )}
          </div>
        )}

        {/* Updated */}
        <div className="mt-3 text-xs" style={{ color: colors.textSecondary }}>
          Updated {formatRelativeTime(repo.updatedAt)}
        </div>
      </div>
    </div>
  );
}

export default memo(GitHubCard);
