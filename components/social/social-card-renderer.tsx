"use client";

import { memo } from "react";
import { 
  SocialPost, 
  TwitterPost, 
  YouTubeVideo, 
  InstagramPost, 
  RedditPost, 
  GitHubRepo, 
  SpotifyContent,
  GenericSocialPost,
  CardTheme,
  DisplayMode,
} from "@/lib/social/types";
import {
  TwitterCard,
  YouTubeCard,
  InstagramCard,
  RedditCard,
  GitHubCard,
  SpotifyCard,
  GenericCard,
} from "./cards";

interface SocialCardRendererProps {
  post: SocialPost;
  displayMode?: DisplayMode;
  theme?: CardTheme;
  showMetrics?: boolean;
  onOpenOriginal?: () => void;
}

function SocialCardRenderer({
  post,
  displayMode = 'full',
  theme = 'dark',
  showMetrics = true,
  onOpenOriginal,
}: SocialCardRendererProps) {
  const handleOpen = () => {
    if (onOpenOriginal) {
      onOpenOriginal();
    } else {
      window.open(post.url, '_blank', 'noopener,noreferrer');
    }
  };

  switch (post.platform) {
    case 'twitter':
      return (
        <TwitterCard
          post={post as TwitterPost}
          theme={theme}
          showMetrics={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'youtube':
      return (
        <YouTubeCard
          video={post as YouTubeVideo}
          theme={theme}
          showMetrics={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'instagram':
      return (
        <InstagramCard
          post={post as InstagramPost}
          theme={theme}
          showMetrics={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'reddit':
      return (
        <RedditCard
          post={post as RedditPost}
          theme={theme}
          showMetrics={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'github':
      return (
        <GitHubCard
          repo={post as GitHubRepo}
          theme={theme}
          showMetrics={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'spotify':
      return (
        <SpotifyCard
          content={post as SpotifyContent}
          theme={theme}
          showPreview={showMetrics}
          onOpenOriginal={handleOpen}
        />
      );

    case 'unknown':
    default:
      return (
        <GenericCard
          post={post as GenericSocialPost}
          theme={theme}
          onOpenOriginal={handleOpen}
        />
      );
  }
}

export default memo(SocialCardRenderer);
