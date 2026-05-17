"use client";

import { useState } from "react";
import type { GeneratedImage, Section } from "@/lib/types";
import { DND_MIME } from "@/components/ApprovedLibrary";

type Props = {
  sections: Section[];
  clips: Record<string, string>;
  approved: Record<string, GeneratedImage>;
  audioDuration: number;
  currentTime: number;
  onDrop: (section_id: string, image_url: string) => void;
  onClear: (section_id: string) => void;
  onSeek?: (seconds: number) => void;
};

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timeline({
  sections,
  clips,
  approved,
  audioDuration,
  currentTime,
  onDrop,
  onClear,
  onSeek,
}: Props) {
  const [hoverDropId, setHoverDropId] = useState<string | null>(null);
  const slotDuration = audioDuration > 0 ? audioDuration / sections.length : 0;
  const activeIndex =
    audioDuration > 0 && currentTime > 0
      ? Math.min(
          sections.length - 1,
          Math.floor((currentTime / audioDuration) * sections.length),
        )
      : -1;

  return (
    <div className="bg-bg-card border border-line rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Clip timeline</h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            One slot per section. Drag approved images here. Slots auto-distribute across the audio.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          {Object.values(clips).filter(Boolean).length}/{sections.length} filled
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          {sections.map((s, i) => {
            const imageUrl = clips[s.id];
            const isActive = i === activeIndex;
            const isHover = hoverDropId === s.id;
            const start = i * slotDuration;
            const end = (i + 1) * slotDuration;
            const draggedImage = imageUrl ? approved[imageUrl] : null;

            return (
              <div
                key={s.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setHoverDropId(s.id);
                }}
                onDragLeave={() => setHoverDropId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setHoverDropId(null);
                  const url =
                    e.dataTransfer.getData(DND_MIME) ||
                    e.dataTransfer.getData("text/plain");
                  if (url) onDrop(s.id, url);
                }}
                onClick={() => onSeek?.(start)}
                className={[
                  "w-44 shrink-0 rounded-lg overflow-hidden border-2 transition cursor-pointer bg-bg-elevated/40",
                  isHover
                    ? "border-accent shadow-[0_0_0_3px_#ff3d5755]"
                    : isActive
                      ? "border-accent"
                      : "border-line",
                ].join(" ")}
                style={{ borderLeftWidth: 4, borderLeftColor: s.color }}
                title={`Click to seek to ${fmt(start)}`}
              >
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-line">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted shrink-0">
                      §{i + 1}
                    </span>
                    <span className="text-xs truncate">{s.summary || s.id}</span>
                  </div>
                </div>

                <div className="relative">
                  {imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={draggedImage?.image_prompt ?? s.summary}
                        className="w-full aspect-[3/2] object-cover bg-bg-elevated"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClear(s.id);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-[10px] leading-none w-5 h-5 rounded"
                        title="Remove from slot"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="w-full aspect-[3/2] flex items-center justify-center text-[11px] text-text-muted bg-bg-elevated/40 border-y border-dashed border-line">
                      drag image here
                    </div>
                  )}
                </div>

                <div className="px-2 py-1.5 text-[10px] text-text-muted flex items-center justify-between">
                  <span>{fmt(start)}</span>
                  <span>{fmt(end)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
