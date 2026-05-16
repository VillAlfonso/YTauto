"use client";

import type { TrendTopic, VideoRef } from "@/lib/types";

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function durationLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoRow({ v }: { v: VideoRef }) {
  return (
    <a
      href={v.url}
      target="_blank"
      rel="noreferrer"
      className="flex gap-3 p-3 rounded-lg hover:bg-bg-elevated transition"
    >
      <div className="relative shrink-0 w-32 aspect-video rounded-md overflow-hidden bg-bg-elevated">
        {/* plain img — avoids Next/Image config friction for now */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
        <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1.5 py-0.5 rounded">
          {durationLabel(v.duration_seconds)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium line-clamp-2">{v.title}</div>
        <div className="text-xs text-text-muted mt-1 truncate">{v.channel}</div>
        <div className="mt-2 flex gap-3 text-[11px] text-text-muted">
          <span>{compactNumber(v.views)} views</span>
          <span>{compactNumber(Math.round(v.view_velocity))}/hr</span>
          <span>{(v.engagement_rate * 100).toFixed(2)}% eng</span>
        </div>
      </div>
      <div className="shrink-0 self-center text-right">
        <div className="text-xs text-text-muted">proxy</div>
        <div className="text-lg font-semibold tabular-nums">{v.proxy_score.toFixed(1)}</div>
      </div>
    </a>
  );
}

export function TrendCard({ topic }: { topic: TrendTopic }) {
  return (
    <div className="bg-bg-card border border-line rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4 border-b border-line">
        <div>
          <div className="text-xs uppercase tracking-wider text-text-muted">topic</div>
          <h3 className="text-lg font-semibold mt-0.5">{topic.label}</h3>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">topic score</div>
          <div className="text-2xl font-bold tabular-nums">
            {topic.topic_proxy_score.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="p-2">
        {topic.top_videos.map((v) => (
          <VideoRow key={v.video_id} v={v} />
        ))}
      </div>

      <div className="p-3 border-t border-line bg-bg-elevated/50">
        <button
          disabled
          className="w-full py-2.5 rounded-lg bg-accent/20 border border-accent text-accent text-sm font-semibold disabled:opacity-70 cursor-not-allowed"
          title="Hooks up to the video render pipeline (next milestone)"
        >
          Generate Video on This →
        </button>
      </div>
    </div>
  );
}
