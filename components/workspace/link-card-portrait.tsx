"use client";

import { Link2, Check, ExternalLink } from "lucide-react";

interface PortraitLinkCardProps {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string;
  linkType?: string;
  isSelected: boolean;
  onCheckboxClick: (e: React.MouseEvent) => void;
}

// Get badge info for link type
function getLinkTypeBadge(linkType?: string): { label: string; color: string } {
  switch (linkType) {
    case "twitter": return { label: "X", color: "bg-black" };
    case "instagram": return { label: "Instagram", color: "bg-pink-500" };
    case "facebook": return { label: "Facebook", color: "bg-blue-600" };
    case "linkedin": return { label: "LinkedIn", color: "bg-blue-700" };
    case "reddit": return { label: "Reddit", color: "bg-orange-600" };
    case "spotify": return { label: "Spotify", color: "bg-green-600" };
    case "github": return { label: "GitHub", color: "bg-gray-800" };
    case "figma": return { label: "Figma", color: "bg-purple-500" };
    case "notion": return { label: "Notion", color: "bg-gray-900" };
    case "article": return { label: "Article", color: "bg-[var(--accent-primary)]" };
    case "pdf": return { label: "PDF", color: "bg-red-500" };
    case "image": return { label: "Image", color: "bg-indigo-500" };
    case "audio": return { label: "Audio", color: "bg-violet-500" };
    default: return { label: "Website", color: "bg-gray-600" };
  }
}

export function PortraitLinkCard({
  id,
  url,
  title,
  thumbnailUrl,
  linkType,
  isSelected,
  onCheckboxClick,
}: PortraitLinkCardProps) {
  const badge = getLinkTypeBadge(linkType);

  return (
    <div className="w-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative block h-56 overflow-hidden bg-gray-900 rounded-2xl transition-all cursor-pointer ${
          isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : "hover:ring-2 hover:ring-gray-300"
        }`}
      >
        {/* Thumbnail */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
            <Link2 className="h-8 w-8 text-white/50" />
          </div>
        )}

        {/* Selection checkbox */}
        <div
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            isSelected
              ? "bg-[var(--accent-primary)]/100 border-[var(--accent-primary)]"
              : "border-white/80 bg-black/30 opacity-0 group-hover:opacity-100"
          }`}
          onClick={onCheckboxClick}
        >
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>

        {/* Link type badge */}
        <div className={`absolute top-3 right-3 px-1.5 py-0.5 ${badge.color} rounded text-[10px] font-medium text-white shadow-sm`}>
          {badge.label}
        </div>

        {/* Bottom gradient with title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-2.5 px-2.5">
          <div className="flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
            <h3 className="font-medium text-white text-xs line-clamp-2 drop-shadow-sm">
              {title || "Untitled"}
            </h3>
          </div>
        </div>

        {/* Hover external link overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ExternalLink className="h-5 w-5 text-white" />
          </div>
        </div>
      </a>
    </div>
  );
}
