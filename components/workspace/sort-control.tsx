"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SortOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SortControlProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  direction: "asc" | "desc";
  onDirectionChange: (direction: "asc" | "desc") => void;
  options: SortOption<T>[];
  size?: "sm" | "md";
  className?: string;
}

const sizeStyles = {
  md: {
    trigger: "px-3 py-1.5 text-sm",
    direction: "px-2.5 text-sm",
    icon: "h-4 w-4",
  },
  sm: {
    trigger: "px-2.5 py-1 text-xs",
    direction: "px-2 text-xs",
    icon: "h-3.5 w-3.5",
  },
} as const;

export function SortControl<T extends string = string>({
  value,
  onValueChange,
  direction,
  onDirectionChange,
  options,
  size = "sm",
  className,
}: SortControlProps<T>) {
  const [open, setOpen] = useState(false);
  const styles = sizeStyles[size];

  const activeOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? options[0];
  }, [options, value]);

  if (!activeOption) {
    return null;
  }

  const Icon = activeOption.icon;

  return (
    <div
      className={cn(
        "inline-flex items-stretch rounded-lg border bg-background text-foreground shadow-sm overflow-hidden",
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:bg-muted",
              styles.trigger
            )}
          >
            {Icon && <Icon className={cn(styles.icon, "text-muted-foreground")} />}
            <span>{activeOption.label}</span>
            <ChevronDown className={cn(styles.icon, "text-muted-foreground")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1 space-y-1" align="start">
          {options.map(({ value: optionValue, label, icon: OptionIcon }) => (
            <button
              key={optionValue}
              type="button"
              onClick={() => {
                onValueChange(optionValue);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                optionValue === activeOption.value
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {OptionIcon && (
                <OptionIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{label}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
        className={cn(
          "flex items-center justify-center border-l transition-colors hover:bg-muted text-muted-foreground",
          styles.direction
        )}
        aria-label={direction === "asc" ? "Sort descending" : "Sort ascending"}
      >
        {direction === "asc" ? (
          <ArrowUp className={cn(styles.icon)} />
        ) : (
          <ArrowDown className={cn(styles.icon)} />
        )}
      </button>
    </div>
  );
}
