"use client";

import { Link2, Check, Play } from "lucide-react";
import Link from "next/link";

interface LandscapeLinkCardProps {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string;
  linkType?: string;
  isSelected: boolean;
  onCheckboxClick: (e: React.MouseEvent) => void;
  workspaceId: string;
}

// Get badge info for link type
function getLinkTypeBadge(linkType?: string): { label: string; color: string } {
  switch (linkType) {
    case "youtube": return { label: "YouTube", color: "bg-red-600" };
    case "vimeo": return { label: "Vimeo", color: "bg-blue-500" };
    case "twitch": return { label: "Twitch", color: "bg-purple-600" };
    case "tiktok": return { label: "TikTok", color: "bg-black" };
    case "video": return { label: "Video", color: "bg-orange-500" };
    default: return { label: "Video", color: "bg-red-600" };
  }
}

export function LandscapeLinkCard({
  id,
  url,
  title,
  thumbnailUrl,
  linkType,
  isSelected,
  onCheckboxClick,
  workspaceId,
}: LandscapeLinkCardProps) {
  const badge = linkType ? getLinkTypeBadge(linkType) : { label: "Video", color: "bg-red-600" };

  return (
    <div className="w-80">
      <Link
        href={`/workspace/${workspaceId}/links/${id}`}
        className={`group relative block h-56 overflow-hidden bg-gray-900 rounded-2xl transition-all cursor-pointer ${
          isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300"
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
            <Link2 className="h-10 w-10 text-white/50" />
          </div>
        )}

        {/* Selection checkbox */}
        <div
          className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer shadow-sm ${
            isSelected
              ? "bg-emerald-500 border-emerald-500"
              : "border-white/80 bg-black/30 opacity-0 group-hover:opacity-100"
          }`}
          onClick={onCheckboxClick}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
        </div>

        {/* Link type badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 ${badge.color} rounded text-[10px] font-medium text-white shadow-sm`}>
          {badge.label}
        </div>

        {/* Bottom gradient with title */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-3 px-3">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="h-3 w-3 text-white fill-white ml-0.5" />
            </div>
            <h3 className="font-medium text-white text-sm line-clamp-2 drop-shadow-sm">
              {title || "Untitled"}
            </h3>
          </div>
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        </div>
      </Link>
    </div>
  );
}
