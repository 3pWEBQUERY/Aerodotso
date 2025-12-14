"use client";

import { useEffect, useState } from "react";
import { LandscapeVideoCard } from "./video-card-landscape";
import { PortraitVideoCard } from "./video-card-portrait";

export type VideoOrientation = "portrait" | "landscape" | "square";

interface VideoCardProps {
  src: string;
  alt: string;
  title: string;
  isSelected: boolean;
  isStarred?: boolean;
  onCheckboxClick: () => void;
  href: string;
}

export function VideoCard({
  src,
  alt,
  title,
  isSelected,
  isStarred,
  onCheckboxClick,
  href,
}: VideoCardProps) {
  const [orientation, setOrientation] = useState<VideoOrientation>("landscape");

  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const handleLoadedMetadata = () => {
      const w = video.videoWidth || 0;
      const h = video.videoHeight || 0;
      if (w > 0 && h > 0) {
        if (h > w * 1.2) {
          setOrientation("portrait");
        } else if (w > h * 1.2) {
          setOrientation("landscape");
        } else {
          setOrientation("square");
        }
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.src = src;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.src = "";
    };
  }, [src]);

  if (orientation === "portrait") {
    return (
      <PortraitVideoCard
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

  return (
    <LandscapeVideoCard
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

export { LandscapeVideoCard } from "./video-card-landscape";
export { PortraitVideoCard } from "./video-card-portrait";
