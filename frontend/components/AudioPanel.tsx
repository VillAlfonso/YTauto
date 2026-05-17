"use client";

type Props = {
  audioUrl: string | null;
  fileName: string | null;
  duration: number;
  onFile: (file: File) => void;
  onClear: () => void;
};

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Audio file management only. The <audio> element and all playback controls
 * live in the parent + Timeline. This component is just the upload prompt
 * (when no audio) or a thin "filename · replace" info pill (when loaded). */
export function AudioPanel({ audioUrl, fileName, duration, onFile, onClear }: Props) {
  if (!audioUrl) {
    return (
      <label className="block bg-bg-card border border-line rounded-xl">
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed border-line rounded-xl cursor-pointer hover:border-text-muted hover:bg-bg-elevated/30 transition">
          <span className="text-sm font-medium">Upload voice-over audio</span>
          <span className="text-[11px] text-text-muted">
            .mp3, .wav, .m4a, .ogg — stays on your machine. Drives the timeline.
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
        </div>
      </label>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-bg-card border border-line rounded-xl px-3 py-2 text-xs">
      <span className="text-[10px] uppercase tracking-widest text-text-muted shrink-0">
        audio
      </span>
      <span className="truncate flex-1 font-medium">{fileName ?? "audio"}</span>
      <span className="text-text-muted tabular-nums shrink-0">{fmt(duration)}</span>
      <button
        onClick={onClear}
        className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted shrink-0"
      >
        replace
      </button>
    </div>
  );
}
