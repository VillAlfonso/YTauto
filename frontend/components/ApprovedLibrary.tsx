"use client";

import type { GeneratedImage } from "@/lib/types";

type Props = {
  approved: Record<string, GeneratedImage>;
  onRemove: (image_url: string) => void;
};

export const DND_MIME = "application/x-ytauto-image";

export function ApprovedLibrary({ approved, onRemove }: Props) {
  const items = Object.values(approved);

  return (
    <div className="bg-bg-card border border-line rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Approved library</h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Drag a thumbnail into a clip slot above the audio.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          {items.length} saved
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-text-muted py-4 text-center">
          Approve images from the board to build your library.
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((img) => (
            <li
              key={img.image_url}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DND_MIME, img.image_url);
                e.dataTransfer.setData("text/plain", img.image_url);
                e.dataTransfer.effectAllowed = "copyMove";
              }}
              className="relative group w-24 cursor-grab active:cursor-grabbing"
              title={img.image_prompt}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt=""
                className="w-24 aspect-[3/2] rounded-md border border-line object-cover bg-bg-elevated pointer-events-none"
              />
              <button
                onClick={() => onRemove(img.image_url)}
                className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-[10px] leading-none w-4 h-4 rounded opacity-0 group-hover:opacity-100 transition"
                title="Remove from library"
              >
                ×
              </button>
              <div className="text-[10px] text-text-muted truncate mt-1">
                {img.section_id}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
