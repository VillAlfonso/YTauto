"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ApprovedLibrary } from "@/components/ApprovedLibrary";
import { AudioPanel } from "@/components/AudioPanel";
import { ImageBoard } from "@/components/ImageBoard";
import { PipelineStages, type Stage, type StageState } from "@/components/PipelineStages";
import { PreviewMonitor } from "@/components/PreviewMonitor";
import { SectionedScriptView } from "@/components/SectionedScriptView";
import { Timeline } from "@/components/Timeline";
import {
  runGenerateImages,
  runImageBriefs,
  runSection,
} from "@/lib/api";
import type {
  GeneratedImage,
  ImageBrief,
  Section,
  TimelineClip,
} from "@/lib/types";

const PLACEHOLDER_SCRIPT = `Paste your finished YouTube script here.

The pipeline will section it, decide an image brief per section, then generate (stub) images for each — chaining them so style stays consistent across the video.

Want a quick test? Paste a few paragraphs of anything — the stubs will section by sentence boundaries and you'll see the full flow.`;

const LS_APPROVED = "ytauto:prototype:approved";
const LS_TIMELINE = "ytauto:prototype:timeline";

export default function StudioPage() {
  const [script, setScript] = useState("");
  const [editing, setEditing] = useState(true);

  const [sections, setSections] = useState<Section[]>([]);
  const [briefs, setBriefs] = useState<ImageBrief[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  // Editor state
  const [approved, setApproved] = useState<Record<string, GeneratedImage>>({});
  const [timeline, setTimeline] = useState<TimelineClip[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Hydrate persisted bits on mount. Audio file isn't persisted — re-upload each session.
  const hydratedRef = useRef(false);
  useEffect(() => {
    try {
      const a = localStorage.getItem(LS_APPROVED);
      if (a) setApproved(JSON.parse(a));
      const t = localStorage.getItem(LS_TIMELINE);
      if (t) setTimeline(JSON.parse(t));
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
        localStorage.setItem(LS_TIMELINE, JSON.stringify(timeline));
      } catch {}
    }
  }, [timeline]);

  // Auto-initialize timeline once we have sections + audio loaded and no clips yet.
  // Preserves user's manual arrangement on subsequent runs.
  useEffect(() => {
    if (timeline.length === 0 && sections.length > 0 && audioDuration > 0) {
      const slot = audioDuration / sections.length;
      const seed = Date.now();
      setTimeline(
        sections.map((s, i) => ({
          id: `c${i + 1}-${seed}`,
          image_url: null,
          start_seconds: +(i * slot).toFixed(3),
          duration_seconds: +slot.toFixed(3),
          section_id: s.id,
        })),
      );
    }
  }, [sections, audioDuration, timeline.length]);

  // Revoke audio ObjectURL on unmount / change
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
    setTimeline([]); // new section_ids — reset clips, library stays
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
    // Also clear any timeline clip referencing this image (keep the clip slot though)
    setTimeline((prev) =>
      prev.map((c) => (c.image_url === image_url ? { ...c, image_url: null } : c)),
    );
  }

  function onAudioFile(f: File) {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(f);
    setAudioUrl(URL.createObjectURL(f));
    setAudioDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }

  function onAudioClear() {
    if (audioRef.current) audioRef.current.pause();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setAudioDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }

  function exportSpec() {
    if (timeline.length === 0) return;
    const sorted = [...timeline].sort((a, b) => a.start_seconds - b.start_seconds);
    const spec = {
      schema: "ytauto-prototype-2",
      generated_at: new Date().toISOString(),
      script,
      audio_duration_seconds: audioDuration,
      audio_filename: audioFile?.name ?? null,
      clips: sorted.map((c) => ({
        id: c.id,
        section_id: c.section_id ?? null,
        start_seconds: +c.start_seconds.toFixed(3),
        end_seconds: +(c.start_seconds + c.duration_seconds).toFixed(3),
        duration_seconds: +c.duration_seconds.toFixed(3),
        image_url: c.image_url,
        image_prompt: c.image_url ? approved[c.image_url]?.image_prompt ?? null : null,
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
  const filledClips = timeline.filter((c) => c.image_url).length;
  const canExport = timeline.length > 0;

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
          Paste a script, run the AI pipeline, approve the keepers, drop them
          onto the timeline. Split / trim / drag — like a real editor.
        </p>
      </header>

      {/* Hidden <audio> element. Timeline drives it via audioRef. */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      )}

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

        {/* Editor — audio upload first, then full timeline once loaded */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm uppercase tracking-widest text-text-muted">
              Editor
            </h2>
            <span className="text-[11px] text-text-muted">
              {timeline.length > 0
                ? `${filledClips}/${timeline.length} clips have images`
                : audioUrl
                  ? "no clips yet"
                  : "upload audio to start the timeline"}
            </span>
          </div>

          <ApprovedLibrary approved={approved} onRemove={removeFromLibrary} />

          <AudioPanel
            audioUrl={audioUrl}
            fileName={audioFile?.name ?? null}
            duration={audioDuration}
            onFile={onAudioFile}
            onClear={onAudioClear}
          />

          {audioUrl && (
            <>
              <PreviewMonitor
                timeline={timeline}
                approved={approved}
                currentTime={currentTime}
                audioDuration={audioDuration}
                isPlaying={isPlaying}
                audioRef={audioRef}
              />
              <Timeline
                timeline={timeline}
                setTimeline={setTimeline}
                approved={approved}
                audioFile={audioFile}
                audioRef={audioRef}
                audioDuration={audioDuration}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            </>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={exportSpec}
              disabled={!canExport}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-30"
              title={
                !canExport
                  ? "Need at least one clip on the timeline"
                  : "Download an edit-spec JSON for an external renderer"
              }
            >
              Export edit-spec (.json)
            </button>
            <p className="text-[11px] text-text-muted max-w-md">
              Stub export — downloads JSON describing every clip's image, start
              and end times. When a real renderer is wired up, this is what
              gets fed to it.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
