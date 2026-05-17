"use client";

import { useMemo, useState } from "react";
import type { ImageBrief, Section } from "@/lib/types";

type Props = {
  script: string;
  sections: Section[];
  briefs?: ImageBrief[];
};

type Segment =
  | { kind: "gap"; text: string }
  | { kind: "section"; text: string; section: Section };

function segment(script: string, sections: Section[]): Segment[] {
  const sorted = [...sections].sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let cursor = 0;
  for (const s of sorted) {
    if (s.start > cursor) out.push({ kind: "gap", text: script.slice(cursor, s.start) });
    out.push({ kind: "section", text: script.slice(s.start, s.end), section: s });
    cursor = s.end;
  }
  if (cursor < script.length) out.push({ kind: "gap", text: script.slice(cursor) });
  return out;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function SectionedScriptView({ script, sections, briefs }: Props) {
  const [active, setActive] = useState<Section | null>(null);
  const segments = useMemo(() => segment(script, sections), [script, sections]);
  const briefByPos = useMemo(() => {
    const m = new Map<string, ImageBrief>();
    (briefs ?? []).forEach((b) => m.set(b.section_id, b));
    return m;
  }, [briefs]);
  const activeBrief = active ? briefByPos.get(active.id) : null;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4">
      <div className="bg-bg-card border border-line rounded-xl p-5 leading-relaxed text-[15px] whitespace-pre-wrap">
        {segments.map((s, i) =>
          s.kind === "gap" ? (
            <span key={i}>{s.text}</span>
          ) : (
            <span
              key={i}
              onMouseEnter={() => setActive(s.section)}
              onFocus={() => setActive(s.section)}
              tabIndex={0}
              title={briefByPos.get(s.section.id)?.image_brief ?? s.section.summary}
              style={{
                backgroundColor: hexWithAlpha(s.section.color, 0.28),
                boxShadow:
                  active?.id === s.section.id
                    ? `inset 0 -2px 0 ${s.section.color}`
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
          Hovered section
        </div>
        {active ? (
          <>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: active.color }}
              />
              <span className="font-medium text-sm">
                {active.summary || active.id}
              </span>
            </div>

            {activeBrief ? (
              <>
                <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                  {activeBrief.subject && (
                    <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-line">
                      {activeBrief.subject}
                    </span>
                  )}
                  {activeBrief.mood && (
                    <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-line">
                      {activeBrief.mood}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs text-text-muted">Image brief</div>
                <p className="mt-1 text-sm leading-snug">{activeBrief.image_brief}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-text-muted">
                Run "Brief images" to see what the art director picked for this section.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            Hover a highlighted span to inspect a section.
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
            All sections ({sections.length})
          </div>
          <ul className="space-y-1 max-h-64 overflow-auto pr-1">
            {sections.map((s) => (
              <li
                key={s.id}
                onMouseEnter={() => setActive(s)}
                className={[
                  "flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer",
                  active?.id === s.id ? "bg-bg-elevated" : "hover:bg-bg-elevated/60",
                ].join(" ")}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">{s.summary || s.id}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
