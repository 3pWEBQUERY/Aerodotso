"use client";

import { ImageIcon, Check, Star } from "lucide-react";
import Link from "next/link";

interface PortraitMediaCardProps {
  src: string;
  alt: string;
  title: string;
  isSelected: boolean;
  isStarred?: boolean;
  onCheckboxClick: () => void;
  href: string;
}

export function PortraitMediaCard({
  src,
  alt,
  title,
  isSelected,
  isStarred,
  onCheckboxClick,
  href,
}: PortraitMediaCardProps) {
  return (
    <div className="cursor-pointer relative group w-40">
      {/* Selection Checkbox */}
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

      {/* Star Badge */}
      {isStarred && (
        <div className="absolute top-3 right-3 z-10">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-md" />
        </div>
      )}

      <Link href={href}>
        <div
          className={`w-40 h-56 rounded-2xl overflow-hidden bg-gray-100 relative ${
            isSelected ? "ring-2 ring-[var(--accent-primary)] ring-offset-2" : ""
          }`}
        >
          {/* Image */}
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Bottom Gradient with Title */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-white/80" />
              <span className="text-xs text-white font-medium truncate">
                {title}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
