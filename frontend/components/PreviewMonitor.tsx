"use client";

import { useMemo } from "react";
import type { GeneratedImage, TimelineClip } from "@/lib/types";

type Props = {
  timeline: TimelineClip[];
  approved: Record<string, GeneratedImage>;
  currentTime: number;
  audioDuration: number;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** The "program monitor". Renders the image of whichever clip the playhead
 * is currently inside. Click it to toggle playback. */
export function PreviewMonitor({
  timeline,
  approved,
  currentTime,
  audioDuration,
  isPlaying,
  audioRef,
}: Props) {
  const activeClip = useMemo(() => {
    return timeline.find(
      (c) =>
        currentTime >= c.start_seconds &&
        currentTime < c.start_seconds + c.duration_seconds,
    );
  }, [timeline, currentTime]);

  const activeMeta = activeClip?.image_url ? approved[activeClip.image_url] : null;
  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  function togglePlay() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        onClick={togglePlay}
        className="relative bg-black border border-line rounded-xl overflow-hidden aspect-video cursor-pointer group select-none"
        title={isPlaying ? "Click to pause" : "Click to play"}
      >
        {activeClip?.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={activeClip.image_url}
            alt={activeMeta?.image_prompt ?? "preview"}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
            {timeline.length === 0
              ? "no clips yet — sections will auto-fill once you generate"
              : activeClip
                ? "clip has no image — drop one from your library"
                : "gap — playhead is between clips"}
          </div>
        )}

        {/* Play/pause overlay — visible when paused, fades on hover when playing */}
        <div
          className={[
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity",
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100",
          ].join(" ")}
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-2xl">
            {isPlaying ? "⏸" : "▶"}
          </div>
        </div>

        {/* Top overlays */}
        <div className="absolute top-0 inset-x-0 flex items-start justify-between p-2 pointer-events-none">
          {activeClip ? (
            <span className="text-[10px] uppercase tracking-widest bg-black/60 text-white px-2 py-1 rounded">
              {activeClip.section_id ? `${activeClip.section_id}` : "clip"}
              {activeMeta?.section_id && activeMeta.section_id !== activeClip.section_id
                ? ` · img ${activeMeta.section_id}`
                : ""}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[10px] uppercase tracking-widest bg-black/60 text-white px-2 py-1 rounded tabular-nums">
            {fmt(currentTime)} / {fmt(audioDuration)}
          </span>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
          <div
            className="h-full bg-accent transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {activeClip?.image_url && activeMeta?.image_prompt && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-text-muted hover:text-text">
            Show this frame's image prompt
          </summary>
          <p className="mt-2 p-2 rounded bg-bg-elevated font-mono text-[11px] leading-snug">
            {activeMeta.image_prompt}
          </p>
        </details>
      )}
    </div>
  );
}
