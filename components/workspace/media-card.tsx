"use client";

import { useState, useEffect } from "react";
import { LandscapeMediaCard } from "./media-card-landscape";
import { PortraitMediaCard } from "./media-card-portrait";

export type MediaOrientation = "portrait" | "landscape" | "square";

interface MediaCardProps {
  src: string;
  alt: string;
  title: string;
  isSelected: boolean;
  isStarred?: boolean;
  onCheckboxClick: () => void;
  href: string;
}

export function MediaCard({
  src,
  alt,
  title,
  isSelected,
  isStarred,
  onCheckboxClick,
  href,
}: MediaCardProps) {
  const [orientation, setOrientation] = useState<MediaOrientation>("landscape");

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth * 1.2) {
        setOrientation("portrait");
      } else if (img.naturalWidth > img.naturalHeight * 1.2) {
        setOrientation("landscape");
      } else {
        setOrientation("square");
      }
    };
    img.src = src;
  }, [src]);

  // Portrait images use the portrait card
  if (orientation === "portrait") {
    return (
      <PortraitMediaCard
        src={src}
        alt={alt}
        title={title}
        isSelected={isSelected}
        isStarred={isStarred}
        onCheckboxClick={onCheckboxClick}
        href={href}
      />
    );
  }

  // Landscape and square images use the landscape card
  return (
    <LandscapeMediaCard
      src={src}
      alt={alt}
      title={title}
      isSelected={isSelected}
      isStarred={isStarred}
      onCheckboxClick={onCheckboxClick}
      href={href}
    />
  );
}

// Re-export individual components for direct use
export { LandscapeMediaCard } from "./media-card-landscape";
export { PortraitMediaCard } from "./media-card-portrait";
