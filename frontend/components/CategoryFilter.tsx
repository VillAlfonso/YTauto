"use client";

import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  active: string;
  onSelect: (key: string) => void;
};

export function CategoryFilter({ categories, active, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const isActive = c.key === active;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            className={[
              "px-4 py-2 rounded-full text-sm font-medium border transition",
              isActive
                ? "bg-accent text-white border-accent shadow-[0_0_0_3px_#ff3d5733]"
                : "bg-bg-elevated text-text-muted border-line hover:text-text hover:border-text-muted",
            ].join(" ")}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
