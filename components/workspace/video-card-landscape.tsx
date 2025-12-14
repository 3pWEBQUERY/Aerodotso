"use client";

import { Check, Star, Film } from "lucide-react";
import Link from "next/link";

interface LandscapeVideoCardProps {
  src: string;
  alt: string;
  title: string;
  isSelected: boolean;
  isStarred?: boolean;
  onCheckboxClick: () => void;
  href: string;
}

export function LandscapeVideoCard({
  src,
  alt,
  title,
  isSelected,
  isStarred,
  onCheckboxClick,
  href,
}: LandscapeVideoCardProps) {
  return (
    <div className="cursor-pointer relative group w-80">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCheckboxClick();
        }}
        className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-emerald-600 border-emerald-600 text-white opacity-100"
            : "bg-white/80 border-gray-300 hover:border-emerald-500 opacity-0 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check className="h-4 w-4" />}
      </button>

      {/* Star Badge */}
      {isStarred && (
        <div className="absolute top-3 right-3 z-10">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-md" />
        </div>
      )}

      {/* Video Badge - positioned below star or at top-right if no star */}
      <div className={`absolute ${isStarred ? "top-10" : "top-3"} right-3 z-10`}>
        <div className="px-2 py-1 rounded-xl bg-black/60 text-white text-[10px] font-medium backdrop-blur">
          Video
        </div>
      </div>

      <Link href={href}>
        <div
          className={`w-80 h-56 rounded-2xl overflow-hidden bg-gray-100 relative ${
            isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
          }`}
        >
          <video
            src={src}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 flex-shrink-0 text-white/80" />
              <span className="text-sm text-white font-medium truncate">{title}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
