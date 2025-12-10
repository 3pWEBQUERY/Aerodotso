"use client";

import { LandscapeLinkCard } from "./link-card-landscape";
import { PortraitLinkCard } from "./link-card-portrait";

interface LinkCardProps {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string;
  linkType?: string;
  isSelected: boolean;
  onCheckboxClick: (e: React.MouseEvent) => void;
  workspaceId: string;
}

// Helper to check if URL is a video
function isVideoUrl(url: string): boolean {
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("twitch.tv") ||
    url.includes("tiktok.com")
  );
}

// Helper to check if link type is video
function isVideoType(linkType?: string): boolean {
  return (
    linkType === "youtube" ||
    linkType === "vimeo" ||
    linkType === "twitch" ||
    linkType === "tiktok" ||
    linkType === "video"
  );
}

export function LinkCard({
  id,
  url,
  title,
  thumbnailUrl,
  linkType,
  isSelected,
  onCheckboxClick,
  workspaceId,
}: LinkCardProps) {
  const isVideo = isVideoType(linkType) || isVideoUrl(url);

  if (isVideo) {
    return (
      <LandscapeLinkCard
        id={id}
        url={url}
        title={title}
        thumbnailUrl={thumbnailUrl}
        linkType={linkType}
        isSelected={isSelected}
        onCheckboxClick={onCheckboxClick}
        workspaceId={workspaceId}
      />
    );
  }

  return (
    <PortraitLinkCard
      id={id}
      url={url}
      title={title}
      thumbnailUrl={thumbnailUrl}
      linkType={linkType}
      isSelected={isSelected}
      onCheckboxClick={onCheckboxClick}
    />
  );
}

// Re-export individual components
export { LandscapeLinkCard } from "./link-card-landscape";
export { PortraitLinkCard } from "./link-card-portrait";
export { isVideoUrl, isVideoType };
