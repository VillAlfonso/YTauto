"use client";

import type { Genre } from "@/lib/types";

type Props = {
  genres: Genre[];
  active: string;
  onSelect: (key: string) => void;
};

export function GenreSelector({ genres, active, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g) => {
        const isActive = g.key === active;
        return (
          <button
            key={g.key}
            onClick={() => onSelect(g.key)}
            className={[
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition",
              isActive
                ? "bg-accent text-white border-accent shadow-[0_0_0_3px_#ff3d5733]"
                : "bg-bg-elevated text-text-muted border-line hover:text-text hover:border-text-muted",
            ].join(" ")}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
}
