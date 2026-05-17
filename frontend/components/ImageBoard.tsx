"use client";

import type { GeneratedImage, ImageBrief, Section } from "@/lib/types";

type Props = {
  script: string;
  sections: Section[];
  briefs: ImageBrief[];
  images: GeneratedImage[];
  approvedUrls?: Set<string>;
  onToggleApprove?: (img: GeneratedImage) => void;
};

export function ImageBoard({
  script,
  sections,
  briefs,
  images,
  approvedUrls,
  onToggleApprove,
}: Props) {
  const byId = (id: string) => ({
    brief: briefs.find((b) => b.section_id === id) ?? null,
    image: images.find((i) => i.section_id === id) ?? null,
  });

  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const { brief, image } = byId(s.id);
        const excerpt = script.slice(s.start, s.end);
        return (
          <article
            key={s.id}
            className="bg-bg-card border border-line rounded-xl overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-2.5 border-b border-line"
              style={{ borderLeft: `4px solid ${s.color}` }}
            >
              <span className="text-[10px] uppercase tracking-widest text-text-muted">
                Section {i + 1}
              </span>
              <span className="text-sm font-medium">{s.summary || s.id}</span>
              {image?.references_previous && (
                <span className="text-[10px] uppercase tracking-widest text-text-muted">
                  ↻ chained from §{i}
                </span>
              )}
              {image && onToggleApprove && (
                <button
                  onClick={() => onToggleApprove(image)}
                  className={[
                    "ml-auto text-[10px] uppercase tracking-widest px-2 py-1 rounded border transition",
                    approvedUrls?.has(image.image_url)
                      ? "bg-accent/15 border-accent text-accent"
                      : "border-line text-text-muted hover:text-text hover:border-text-muted",
                  ].join(" ")}
                >
                  {approvedUrls?.has(image.image_url) ? "✓ approved" : "approve"}
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-[1fr_240px] gap-4 p-4">
              <div className="space-y-3 min-w-0">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-text-muted">
                    Script excerpt
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted italic">
                    {excerpt}
                  </p>
                </div>

                {brief ? (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">
                      Image brief
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {brief.subject && (
                        <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-line">
                          {brief.subject}
                        </span>
                      )}
                      {brief.mood && (
                        <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-line">
                          {brief.mood}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-snug">{brief.image_brief}</p>
                  </div>
                ) : (
                  <div className="text-xs text-text-muted">
                    No brief yet — run "Brief images".
                  </div>
                )}

                {image && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-text-muted hover:text-text">
                      Show generation prompt
                    </summary>
                    <p className="mt-2 p-2 rounded bg-bg-elevated font-mono text-[11px] leading-snug">
                      {image.image_prompt}
                    </p>
                  </details>
                )}
              </div>

              <div className="md:w-[240px]">
                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={image.image_url}
                    alt={brief?.image_brief ?? s.summary}
                    className="w-full aspect-[3/2] rounded-lg border border-line object-cover bg-bg-elevated"
                  />
                ) : (
                  <div className="w-full aspect-[3/2] rounded-lg border border-dashed border-line bg-bg-elevated/40 flex items-center justify-center text-xs text-text-muted">
                    no image yet
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
