"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApprovedLibrary } from "@/components/ApprovedLibrary";
import { AudioPanel } from "@/components/AudioPanel";
import { ImageBoard } from "@/components/ImageBoard";
import { PipelineStages, type Stage, type StageState } from "@/components/PipelineStages";
import { SectionedScriptView } from "@/components/SectionedScriptView";
import { Timeline } from "@/components/Timeline";
import {
  runGenerateImages,
  runImageBriefs,
  runSection,
} from "@/lib/api";
import type { GeneratedImage, ImageBrief, Section } from "@/lib/types";

const PLACEHOLDER_SCRIPT = `Paste your finished YouTube script here.

The pipeline will section it, decide an image brief per section, then generate (stub) images for each — chaining them so style stays consistent across the video.

Want a quick test? Paste a few paragraphs of anything — the stubs will section by sentence boundaries and you'll see the full flow.`;

const LS_APPROVED = "ytauto:prototype:approved";
const LS_CLIPS = "ytauto:prototype:clips";

export default function StudioPage() {
  const [script, setScript] = useState("");
  const [editing, setEditing] = useState(true);

  const [sections, setSections] = useState<Section[]>([]);
  const [briefs, setBriefs] = useState<ImageBrief[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  // Editor state
  const [approved, setApproved] = useState<Record<string, GeneratedImage>>({});
  const [clips, setClips] = useState<Record<string, string>>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekSignal, setSeekSignal] = useState(0);
  const [seekTo, setSeekTo] = useState(0);

  // Hydrate persisted bits on mount. Audio file isn't persisted — re-upload each session.
  const hydratedRef = useRef(false);
  useEffect(() => {
    try {
      const a = localStorage.getItem(LS_APPROVED);
      if (a) setApproved(JSON.parse(a));
      const c = localStorage.getItem(LS_CLIPS);
      if (c) setClips(JSON.parse(c));
    } catch {}
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (hydratedRef.current) {
      try {
        localStorage.setItem(LS_APPROVED, JSON.stringify(approved));
      } catch {}
    }
  }, [approved]);

  useEffect(() => {
    if (hydratedRef.current) {
      try {
        localStorage.setItem(LS_CLIPS, JSON.stringify(clips));
      } catch {}
    }
  }, [clips]);

  // Cleanup ObjectURL when audio changes / unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const [stageState, setStageState] = useState<Record<string, StageState>>({
    section: "idle",
    brief: "idle",
    generate: "idle",
  });
  const [stageDetail, setStageDetail] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function mark(key: string, state: StageState, detail?: string) {
    setStageState((s) => ({ ...s, [key]: state }));
    if (detail !== undefined) setStageDetail((s) => ({ ...s, [key]: detail }));
  }

  async function doSection() {
    if (!script.trim()) return;
    setError(null);
    setSections([]);
    setBriefs([]);
    setImages([]);
    setClips({}); // section_ids tie to a specific run — reset, keep approved library
    setStageState({ section: "running", brief: "idle", generate: "idle" });
    setStageDetail({});
    try {
      const r = await runSection(script);
      setSections(r.sections);
      mark("section", "done", `${r.sections.length} sections`);
      setEditing(false);
    } catch (e) {
      const msg = String(e);
      setError(msg);
      mark("section", "error", msg.slice(0, 80));
    }
  }

  async function doBriefs() {
    if (!sections.length) return;
    setError(null);
    setBriefs([]);
    setImages([]);
    mark("brief", "running");
    mark("generate", "idle", "");
    try {
      const r = await runImageBriefs(script, sections);
      setBriefs(r.briefs);
      mark("brief", "done", `${r.briefs.length} briefs`);
    } catch (e) {
      const msg = String(e);
      setError(msg);
      mark("brief", "error", msg.slice(0, 80));
    }
  }

  async function doGenerate() {
    if (!briefs.length) return;
    setError(null);
    setImages([]);
    mark("generate", "running");
    try {
      const r = await runGenerateImages(briefs);
      setImages(r.images);
      const chained = r.images.filter((i) => i.references_previous).length;
      mark("generate", "done", `${r.images.length} images · ${chained} chained`);
    } catch (e) {
      const msg = String(e);
      setError(msg);
      mark("generate", "error", msg.slice(0, 80));
    }
  }

  function toggleApprove(img: GeneratedImage) {
    setApproved((prev) => {
      const next = { ...prev };
      if (next[img.image_url]) delete next[img.image_url];
      else next[img.image_url] = img;
      return next;
    });
  }

  function removeFromLibrary(image_url: string) {
    setApproved((prev) => {
      const next = { ...prev };
      delete next[image_url];
      return next;
    });
    // Also clear any timeline slot that referenced it
    setClips((prev) => {
      const next: Record<string, string> = {};
      for (const [sid, url] of Object.entries(prev)) {
        if (url !== image_url) next[sid] = url;
      }
      return next;
    });
  }

  function dropClip(section_id: string, image_url: string) {
    setClips((prev) => ({ ...prev, [section_id]: image_url }));
  }

  function clearClip(section_id: string) {
    setClips((prev) => {
      const next = { ...prev };
      delete next[section_id];
      return next;
    });
  }

  function onAudioFile(f: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setAudioDuration(0);
    setCurrentTime(0);
  }

  function onAudioClear() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setCurrentTime(0);
  }

  function seekTimeline(t: number) {
    setSeekTo(t);
    setSeekSignal((n) => n + 1);
  }

  function exportSpec() {
    if (sections.length === 0) return;
    const slot = audioDuration > 0 ? audioDuration / sections.length : 0;
    const spec = {
      schema: "ytauto-prototype-1",
      generated_at: new Date().toISOString(),
      script,
      audio_duration_seconds: audioDuration,
      audio_filename: audioFile?.name ?? null,
      clips: sections.map((s, i) => ({
        section_id: s.id,
        summary: s.summary,
        start_seconds: +(i * slot).toFixed(3),
        end_seconds: +((i + 1) * slot).toFixed(3),
        image_url: clips[s.id] ?? null,
        image_prompt: clips[s.id]
          ? approved[clips[s.id]]?.image_prompt ?? null
          : null,
      })),
    };
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ytauto-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const stages: Stage[] = [
    { key: "section", label: "Sectioner", state: stageState.section, detail: stageDetail.section },
    { key: "brief", label: "Image Decider", state: stageState.brief, detail: stageDetail.brief },
    { key: "generate", label: "Image Generator", state: stageState.generate, detail: stageDetail.generate },
  ];

  const approvedUrls = useMemo(() => new Set(Object.keys(approved)), [approved]);
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const canBrief = sections.length > 0 && stageState.section !== "running";
  const canGenerate = briefs.length > 0 && stageState.brief !== "running";
  const filledClips = Object.values(clips).filter(Boolean).length;
  const canExport = sections.length > 0 && audioUrl !== null;

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-text-muted">YTauto</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 border border-accent text-accent uppercase tracking-widest">
            prototype
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Studio</h1>
        <p className="text-text-muted text-sm mt-1 max-w-prose">
          Paste a finished script. Three AIs in sequence: section it, brief each
          section's image, then generate the images one at a time so style
          stays consistent across the video. Approve the keepers and drop them
          into the timeline above your voice-over.
        </p>
      </header>

      <div className="space-y-6">
        {/* Script panel */}
        <section className="bg-bg-card border border-line rounded-xl p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-3 gap-3">
            <div>
              <h2 className="text-lg font-semibold">Script</h2>
              <p className="text-xs text-text-muted">
                {script
                  ? `${script.length} chars · ~${wordCount} words`
                  : "Paste your script. Nothing leaves your machine until you hit a stage button."}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1.5 rounded-md border border-line text-text-muted hover:text-text hover:border-text-muted"
              >
                Edit script
              </button>
            )}
          </div>

          {editing ? (
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={PLACEHOLDER_SCRIPT}
              rows={14}
              className="w-full bg-bg-elevated border border-line rounded-lg p-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent font-mono"
            />
          ) : (
            <div className="text-sm text-text-muted line-clamp-3 italic">{script}</div>
          )}
        </section>

        {/* Stage controls */}
        <section className="bg-bg-card border border-line rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={doSection}
              disabled={!script.trim() || stageState.section === "running"}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {stageState.section === "running" ? "Sectioning…" : "1. Section"}
            </button>
            <button
              onClick={doBriefs}
              disabled={!canBrief}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30"
            >
              {stageState.brief === "running" ? "Briefing…" : "2. Brief images"}
            </button>
            <button
              onClick={doGenerate}
              disabled={!canGenerate}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30"
            >
              {stageState.generate === "running" ? "Generating…" : "3. Generate images"}
            </button>
            {error && <span className="text-xs text-accent break-all self-center">{error}</span>}
          </div>

          <PipelineStages stages={stages} />
        </section>

        {sections.length > 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-3">
              Sectioned script
            </h2>
            <SectionedScriptView script={script} sections={sections} briefs={briefs} />
          </section>
        )}

        {sections.length > 0 && (briefs.length > 0 || images.length > 0) && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-3">
              Image board
            </h2>
            <ImageBoard
              script={script}
              sections={sections}
              briefs={briefs}
              images={images}
              approvedUrls={approvedUrls}
              onToggleApprove={toggleApprove}
            />
          </section>
        )}

        {/* Editor — appears once there are sections to scaffold the timeline */}
        {sections.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-widest text-text-muted">
                Editor
              </h2>
              <span className="text-[11px] text-text-muted">
                {filledClips}/{sections.length} clips filled
                {audioUrl ? ` · audio ${Math.round(audioDuration)}s` : " · no audio"}
              </span>
            </div>

            <ApprovedLibrary approved={approved} onRemove={removeFromLibrary} />

            <Timeline
              sections={sections}
              clips={clips}
              approved={approved}
              audioDuration={audioDuration}
              currentTime={currentTime}
              onDrop={dropClip}
              onClear={clearClip}
              onSeek={seekTimeline}
            />

            <AudioPanel
              audioUrl={audioUrl}
              fileName={audioFile?.name ?? null}
              duration={audioDuration}
              currentTime={currentTime}
              onFile={onAudioFile}
              onClear={onAudioClear}
              onTimeUpdate={setCurrentTime}
              onDuration={setAudioDuration}
              seekSignal={seekSignal}
              seekTo={seekTo}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={exportSpec}
                disabled={!canExport}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30"
                title={
                  !canExport
                    ? "Section a script and upload audio first"
                    : "Download an edit-spec JSON that an external renderer can consume"
                }
              >
                Export edit-spec (.json)
              </button>
              <p className="text-[11px] text-text-muted max-w-md">
                Stub export — downloads a JSON describing the timeline (clips,
                durations, image URLs). When the render pipeline is wired up,
                this is what gets handed to it.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
