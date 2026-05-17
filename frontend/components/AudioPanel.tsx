"use client";

import { useEffect, useRef } from "react";

type Props = {
  audioUrl: string | null;
  fileName: string | null;
  duration: number;
  currentTime: number;
  onFile: (file: File) => void;
  onClear: () => void;
  onTimeUpdate: (t: number) => void;
  onDuration: (d: number) => void;
  seekSignal?: number; // change this number to imperatively seek to a time
  seekTo?: number;
};

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPanel({
  audioUrl,
  fileName,
  duration,
  currentTime,
  onFile,
  onClear,
  onTimeUpdate,
  onDuration,
  seekSignal,
  seekTo,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Imperative seek when parent bumps seekSignal.
  useEffect(() => {
    if (audioRef.current && typeof seekTo === "number") {
      audioRef.current.currentTime = seekTo;
    }
  }, [seekSignal, seekTo]);

  return (
    <div className="bg-bg-card border border-line rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">Voice-over audio</h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Drives the timeline. Slots above auto-distribute across the audio length.
          </p>
        </div>
        {audioUrl && (
          <span className="text-[10px] uppercase tracking-widest text-text-muted">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
        )}
      </div>

      {!audioUrl ? (
        <label className="flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed border-line rounded-lg cursor-pointer hover:border-text-muted hover:bg-bg-elevated/30 transition">
          <span className="text-sm">Click to upload audio</span>
          <span className="text-[11px] text-text-muted">
            .mp3, .wav, .m4a, .ogg — stays on your machine
          </span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="truncate">{fileName ?? "audio"}</span>
            <button
              onClick={onClear}
              className="text-[10px] uppercase tracking-widest text-text-muted hover:text-text"
            >
              replace
            </button>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full"
            onLoadedMetadata={(e) => onDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          />
        </>
      )}
    </div>
  );
}
