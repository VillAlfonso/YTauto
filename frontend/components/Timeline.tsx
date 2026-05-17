"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DND_MIME } from "@/components/ApprovedLibrary";
import { WaveformCanvas } from "@/components/WaveformCanvas";
import type { GeneratedImage, TimelineClip } from "@/lib/types";

type Props = {
  timeline: TimelineClip[];
  setTimeline: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  approved: Record<string, GeneratedImage>;
  audioFile: File | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioDuration: number;
  currentTime: number;
  isPlaying: boolean;
};

const MIN_CLIP_SECONDS = 0.2;
const MIN_PPS = 20;
const MAX_PPS = 200;

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timeline({
  timeline,
  setTimeline,
  approved,
  audioFile,
  audioRef,
  audioDuration,
  currentTime,
  isPlaying,
}: Props) {
  const [pps, setPps] = useState(60);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trackScrollRef = useRef<HTMLDivElement | null>(null);

  const sortedClips = useMemo(
    () => [...timeline].sort((a, b) => a.start_seconds - b.start_seconds),
    [timeline],
  );

  const activeClipId = useMemo(() => {
    const c = sortedClips.find(
      (c) =>
        currentTime >= c.start_seconds &&
        currentTime < c.start_seconds + c.duration_seconds,
    );
    return c?.id ?? null;
  }, [sortedClips, currentTime]);

  const totalWidth = Math.max(audioDuration * pps, 800);

  function seekTo(t: number) {
    const clamped = Math.max(0, Math.min(audioDuration, t));
    if (audioRef.current) audioRef.current.currentTime = clamped;
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) audioRef.current.play();
    else audioRef.current.pause();
  }

  function splitAtPlayhead() {
    setTimeline((prev) => {
      const i = prev.findIndex(
        (c) =>
          currentTime > c.start_seconds + MIN_CLIP_SECONDS &&
          currentTime < c.start_seconds + c.duration_seconds - MIN_CLIP_SECONDS,
      );
      if (i === -1) return prev;
      const c = prev[i];
      const leftDur = currentTime - c.start_seconds;
      const newId = `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const left = { ...c, duration_seconds: leftDur };
      const right = {
        ...c,
        id: newId,
        start_seconds: currentTime,
        duration_seconds: c.duration_seconds - leftDur,
      };
      const next = [...prev];
      next.splice(i, 1, left, right);
      return next;
    });
  }

  function deleteSelected() {
    if (!selectedId) return;
    setTimeline((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }

  function moveClip(id: string, newStart: number) {
    setTimeline((prev) => {
      const sorted = [...prev].sort((a, b) => a.start_seconds - b.start_seconds);
      const idx = sorted.findIndex((c) => c.id === id);
      const me = sorted[idx];
      if (!me) return prev;
      const minStart =
        idx > 0 ? sorted[idx - 1].start_seconds + sorted[idx - 1].duration_seconds : 0;
      const maxStart =
        idx < sorted.length - 1
          ? sorted[idx + 1].start_seconds - me.duration_seconds
          : Math.max(0, audioDuration - me.duration_seconds);
      const clamped = Math.max(minStart, Math.min(maxStart, newStart));
      return prev.map((c) => (c.id === id ? { ...c, start_seconds: clamped } : c));
    });
  }

  function trimLeft(id: string, newStart: number) {
    setTimeline((prev) => {
      const sorted = [...prev].sort((a, b) => a.start_seconds - b.start_seconds);
      const idx = sorted.findIndex((c) => c.id === id);
      const me = sorted[idx];
      if (!me) return prev;
      const myEnd = me.start_seconds + me.duration_seconds;
      const minStart =
        idx > 0 ? sorted[idx - 1].start_seconds + sorted[idx - 1].duration_seconds : 0;
      const clampedStart = Math.max(minStart, Math.min(myEnd - MIN_CLIP_SECONDS, newStart));
      return prev.map((c) =>
        c.id === id
          ? { ...c, start_seconds: clampedStart, duration_seconds: myEnd - clampedStart }
          : c,
      );
    });
  }

  function trimRight(id: string, newEnd: number) {
    setTimeline((prev) => {
      const sorted = [...prev].sort((a, b) => a.start_seconds - b.start_seconds);
      const idx = sorted.findIndex((c) => c.id === id);
      const me = sorted[idx];
      if (!me) return prev;
      const maxEnd =
        idx < sorted.length - 1 ? sorted[idx + 1].start_seconds : audioDuration;
      const clampedEnd = Math.max(
        me.start_seconds + MIN_CLIP_SECONDS,
        Math.min(maxEnd, newEnd),
      );
      return prev.map((c) =>
        c.id === id ? { ...c, duration_seconds: clampedEnd - c.start_seconds } : c,
      );
    });
  }

  function timeFromClientX(clientX: number): number {
    const el = trackScrollRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return Math.max(0, x / pps);
  }

  function onDropOnTrack(e: React.DragEvent) {
    e.preventDefault();
    const url =
      e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData("text/plain");
    if (!url) return;
    const time = timeFromClientX(e.clientX);
    // Drop on existing clip = set its image
    const hit = timeline.find(
      (c) => time >= c.start_seconds && time < c.start_seconds + c.duration_seconds,
    );
    if (hit) {
      setTimeline((prev) =>
        prev.map((c) => (c.id === hit.id ? { ...c, image_url: url } : c)),
      );
      return;
    }
    // Empty space = create new clip, clamped to next neighbor
    const sorted = [...timeline].sort((a, b) => a.start_seconds - b.start_seconds);
    const next = sorted.find((c) => c.start_seconds > time);
    const maxDur = next ? next.start_seconds - time : Math.max(0, audioDuration - time);
    const dur = Math.min(3, Math.max(MIN_CLIP_SECONDS, maxDur));
    if (dur < MIN_CLIP_SECONDS) return;
    const id = `c${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setTimeline((prev) => [
      ...prev,
      { id, image_url: url, start_seconds: time, duration_seconds: dur },
    ]);
  }

  function onSeekClick(e: React.MouseEvent) {
    seekTo(timeFromClientX(e.clientX));
  }

  function startBodyDrag(e: React.PointerEvent, clip: TimelineClip) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(clip.id);
    const startX = e.clientX;
    const startSec = clip.start_seconds;
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      moveClip(clip.id, startSec + dx / pps);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startTrimLeft(e: React.PointerEvent, clip: TimelineClip) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(clip.id);
    const startX = e.clientX;
    const startSec = clip.start_seconds;
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      trimLeft(clip.id, startSec + dx / pps);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startTrimRight(e: React.PointerEvent, clip: TimelineClip) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(clip.id);
    const startX = e.clientX;
    const startEnd = clip.start_seconds + clip.duration_seconds;
    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      trimRight(clip.id, startEnd + dx / pps);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // Keyboard shortcuts. Ignored when typing in inputs/textareas.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyC") {
        splitAtPlayhead();
      } else if (e.code === "Delete" || e.code === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.code === "ArrowLeft") {
        seekTo(currentTime - (e.shiftKey ? 5 : 1));
      } else if (e.code === "ArrowRight") {
        seekTo(currentTime + (e.shiftKey ? 5 : 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentTime, selectedId, timeline, pps]); // eslint-disable-line react-hooks/exhaustive-deps

  const tickInterval = pps >= 80 ? 1 : pps >= 40 ? 2 : 5;
  const labelEvery = tickInterval === 1 ? 5 : tickInterval === 2 ? 10 : 10;
  const ticks: number[] = [];
  for (let t = 0; t <= audioDuration + 0.5; t += tickInterval) ticks.push(t);

  return (
    <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <button
          onClick={togglePlay}
          className="px-3 py-1.5 rounded-md bg-accent text-white text-sm font-semibold min-w-[80px]"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <span className="text-xs text-text-muted tabular-nums">
          {fmt(currentTime)} / {fmt(audioDuration)}
        </span>
        <span className="w-px h-5 bg-line mx-1" />
        <button
          onClick={splitAtPlayhead}
          className="text-xs px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted"
          title="Split clip at playhead (C)"
        >
          ✂ Split
        </button>
        <button
          onClick={deleteSelected}
          disabled={!selectedId}
          className="text-xs px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted disabled:opacity-30 disabled:hover:text-text-muted disabled:hover:border-line"
          title="Delete selected clip (⌫)"
        >
          ✕ Delete
        </button>
        <span className="w-px h-5 bg-line mx-1" />
        <button
          onClick={() => setPps((p) => Math.max(MIN_PPS, p - 20))}
          className="text-xs px-2 py-1 rounded border border-line text-text-muted hover:text-text"
          title="Zoom out"
        >
          −
        </button>
        <span className="text-[10px] uppercase tracking-widest text-text-muted">
          {pps}px/s
        </span>
        <button
          onClick={() => setPps((p) => Math.min(MAX_PPS, p + 20))}
          className="text-xs px-2 py-1 rounded border border-line text-text-muted hover:text-text"
          title="Zoom in"
        >
          +
        </button>
        <span className="ml-auto text-[10px] text-text-muted hidden sm:block">
          Space play · C split · ⌫ delete · ←/→ seek
        </span>
      </div>

      {/* Scrollable tracks */}
      <div
        ref={trackScrollRef}
        className="overflow-x-auto overflow-y-hidden"
        onClick={(e) => {
          // Deselect when clicking the empty background
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        <div
          className="relative select-none"
          style={{ width: totalWidth, minWidth: "100%" }}
        >
          {/* Ruler */}
          <div
            onClick={onSeekClick}
            className="h-7 border-b border-line bg-bg-elevated/30 cursor-pointer relative"
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute top-0 bottom-0"
                style={{ left: t * pps }}
              >
                <div className="absolute top-0 bottom-2 w-px bg-line" />
                {t % labelEvery === 0 && (
                  <div className="absolute top-1 left-1 text-[10px] text-text-muted tabular-nums">
                    {fmt(t)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Video track */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={onDropOnTrack}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onSeekClick(e);
                setSelectedId(null);
              }
            }}
            className="relative h-20 bg-bg-elevated/10 border-b border-line"
          >
            <div className="absolute top-1 left-2 text-[10px] uppercase tracking-widest text-text-muted pointer-events-none">
              video
            </div>
            {sortedClips.map((clip) => {
              const left = clip.start_seconds * pps;
              const width = Math.max(2, clip.duration_seconds * pps);
              const isActive = clip.id === activeClipId;
              const isSelected = clip.id === selectedId;
              const meta = clip.image_url ? approved[clip.image_url] : null;
              return (
                <div
                  key={clip.id}
                  onPointerDown={(e) => startBodyDrag(e, clip)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(clip.id);
                  }}
                  className={[
                    "absolute top-1.5 bottom-1.5 rounded overflow-hidden cursor-grab active:cursor-grabbing border-2 group",
                    isSelected
                      ? "border-accent shadow-[0_0_0_2px_#ff3d5755] z-10"
                      : isActive
                        ? "border-accent/60"
                        : "border-line",
                  ].join(" ")}
                  style={{ left, width }}
                  title={meta?.image_prompt ?? "(no image)"}
                >
                  {clip.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={clip.image_url}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none bg-bg-elevated"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-text-muted bg-bg-card pointer-events-none">
                      drop image
                    </div>
                  )}
                  {/* Trim handles */}
                  <div
                    onPointerDown={(e) => startTrimLeft(e, clip)}
                    className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize bg-accent/0 hover:bg-accent/60 transition-colors"
                  />
                  <div
                    onPointerDown={(e) => startTrimRight(e, clip)}
                    className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize bg-accent/0 hover:bg-accent/60 transition-colors"
                  />
                </div>
              );
            })}
          </div>

          {/* Audio track */}
          <div
            onClick={onSeekClick}
            className="relative cursor-pointer bg-bg-elevated/10"
          >
            <div className="absolute top-1 left-2 text-[10px] uppercase tracking-widest text-text-muted pointer-events-none z-10">
              audio
            </div>
            <WaveformCanvas
              audioFile={audioFile}
              duration={audioDuration}
              pixelsPerSecond={pps}
              height={56}
            />
          </div>

          {/* Playhead — overlays everything below the ruler */}
          <div
            className="absolute top-0 bottom-0 w-px bg-accent pointer-events-none"
            style={{ left: currentTime * pps }}
          >
            <div className="absolute -top-0 -left-[5px] w-[11px] h-3 bg-accent rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
