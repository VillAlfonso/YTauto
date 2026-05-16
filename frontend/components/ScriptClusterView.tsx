"use client";

import { useMemo, useState } from "react";
import type { Cluster } from "@/lib/types";

type Props = {
  script: string;
  clusters: Cluster[];
};

type Segment =
  | { kind: "gap"; text: string }
  | { kind: "cluster"; text: string; cluster: Cluster };

/** Walk the script and emit segments: gaps (untagged text) and clusters. */
function segment(script: string, clusters: Cluster[]): Segment[] {
  const sorted = [...clusters].sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.start > cursor) {
      out.push({ kind: "gap", text: script.slice(cursor, c.start) });
    }
    out.push({ kind: "cluster", text: script.slice(c.start, c.end), cluster: c });
    cursor = c.end;
  }
  if (cursor < script.length) {
    out.push({ kind: "gap", text: script.slice(cursor) });
  }
  return out;
}

export function ScriptClusterView({ script, clusters }: Props) {
  const [active, setActive] = useState<Cluster | null>(null);
  const segments = useMemo(() => segment(script, clusters), [script, clusters]);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-bg-card border border-line rounded-xl p-5 leading-relaxed text-[15px] whitespace-pre-wrap">
        {segments.map((s, i) =>
          s.kind === "gap" ? (
            <span key={i}>{s.text}</span>
          ) : (
            <span
              key={i}
              onMouseEnter={() => setActive(s.cluster)}
              onFocus={() => setActive(s.cluster)}
              tabIndex={0}
              title={s.cluster.suggested_image}
              style={{
                backgroundColor: hexWithAlpha(s.cluster.color, 0.28),
                boxShadow:
                  active?.id === s.cluster.id
                    ? `inset 0 -2px 0 ${s.cluster.color}`
                    : "none",
              }}
              className="rounded-sm px-0.5 cursor-help transition-shadow"
            >
              {s.text}
            </span>
          ),
        )}
      </div>

      <aside className="lg:sticky lg:top-20 self-start bg-bg-card border border-line rounded-xl p-4 h-fit">
        <div className="text-xs uppercase tracking-widest text-text-muted">
          Hovered scene
        </div>
        {active ? (
          <>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: active.color }}
              />
              <span className="font-medium text-sm">
                {active.label || active.id}
              </span>
            </div>
            <div className="mt-3 text-xs text-text-muted">MS Paint brief</div>
            <p className="mt-1 text-sm leading-snug">{active.suggested_image}</p>
            {active.scene_description && (
              <>
                <div className="mt-3 text-xs text-text-muted">Notes</div>
                <p className="mt-1 text-sm leading-snug text-text-muted">
                  {active.scene_description}
                </p>
              </>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            Hover a highlighted span to see what to draw.
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
            All clusters ({clusters.length})
          </div>
          <ul className="space-y-1 max-h-64 overflow-auto pr-1">
            {clusters.map((c) => (
              <li
                key={c.id}
                onMouseEnter={() => setActive(c)}
                className={[
                  "flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer",
                  active?.id === c.id ? "bg-bg-elevated" : "hover:bg-bg-elevated/60",
                ].join(" ")}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate">{c.label || c.suggested_image}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
