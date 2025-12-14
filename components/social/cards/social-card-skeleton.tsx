"use client";

import { memo } from "react";
import { SupportedPlatform } from "@/lib/social/types";

interface SocialCardSkeletonProps {
  platform?: SupportedPlatform;
}

const PLATFORM_COLORS: Record<SupportedPlatform, string> = {
  twitter: '#1D9BF0',
  youtube: '#FF0000',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  threads: '#000000',
  bluesky: '#0085FF',
  facebook: '#1877F2',
  reddit: '#FF4500',
  pinterest: '#E60023',
  spotify: '#1DB954',
  github: '#333333',
  medium: '#000000',
  substack: '#FF6719',
  vimeo: '#1AB7EA',
  twitch: '#9146FF',
  soundcloud: '#FF5500',
  mastodon: '#6364FF',
  unknown: '#6B7280',
};

function SocialCardSkeleton({ platform = 'unknown' }: SocialCardSkeletonProps) {
  const accentColor = PLATFORM_COLORS[platform];

  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse"
      style={{
        borderColor: `${accentColor}40`,
        borderWidth: '1px',
        backgroundColor: '#1A1A1A',
        maxWidth: '400px',
        minWidth: '280px',
      }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-700" />
          
          {/* Name & Handle */}
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-24" />
          </div>
          
          {/* Platform Icon */}
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: `${accentColor}60` }}
          />
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>

        {/* Media Placeholder */}
        {platform !== 'twitter' && platform !== 'threads' && (
          <div className="mt-4 aspect-video bg-gray-700 rounded-lg" />
        )}

        {/* Metrics */}
        <div className="mt-4 flex gap-4">
          <div className="h-4 bg-gray-700 rounded w-12" />
          <div className="h-4 bg-gray-700 rounded w-12" />
          <div className="h-4 bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default memo(SocialCardSkeleton);
