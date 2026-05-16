"use client";

import { useEffect, useState } from "react";
import { GenreSelector } from "@/components/GenreSelector";
import { PipelineStages, type Stage, type StageState } from "@/components/PipelineStages";
import { RouteMapperSection } from "@/components/RouteMapperSection";
import { ScriptClusterView } from "@/components/ScriptClusterView";
import { TitleForgeSection } from "@/components/TitleForgeSection";
import {
  fetchGenres,
  runClusters,
  runDeepDive,
  runOrganize,
  runScript,
} from "@/lib/api";
import type {
  Cluster,
  DeepDiveSeed,
  Finding,
  Genre,
  Route,
  Script,
  Story,
  TitleCandidate,
} from "@/lib/types";

type StoryResult = {
  story: Story;
  script?: Script;
  clusters?: Cluster[];
  error?: string;
};

type SourceMode = "genre" | "seed";

export default function StudioPage() {
  // Title forge / route mapper picks
  const [pickedTitle, setPickedTitle] = useState<TitleCandidate | null>(null);
  const [pickedRoute, setPickedRoute] = useState<{ title: string; route: Route } | null>(
    null,
  );

  // Pipeline source
  const [sourceMode, setSourceMode] = useState<SourceMode>("genre");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>("philosophy");
  const [count, setCount] = useState(5);

  // Pipeline run state
  const [findings, setFindings] = useState<Finding[]>([]);
  const [stories, setStories] = useState<StoryResult[]>([]);
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageState, setStageState] = useState<Record<string, StageState>>({
    deep: "idle",
    organize: "idle",
    script: "idle",
    clusters: "idle",
  });
  const [stageDetail, setStageDetail] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGenres()
      .then((g) => {
        setGenres(g);
        if (g.length && !g.find((x) => x.key === activeGenre)) setActiveGenre(g[0].key);
      })
      .catch((e) => setError(String(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user picks a route, auto-switch to seed source so the pipeline uses it.
  useEffect(() => {
    if (pickedRoute) setSourceMode("seed");
  }, [pickedRoute]);

  function mark(key: string, state: StageState, detail?: string) {
    setStageState((s) => ({ ...s, [key]: state }));
    if (detail !== undefined) setStageDetail((s) => ({ ...s, [key]: detail }));
  }

  async function run() {
    setError(null);
    setRunning(true);
    setFindings([]);
    setStories([]);
    setOpenStoryId(null);
    setStageState({ deep: "idle", organize: "idle", script: "idle", clusters: "idle" });
    setStageDetail({});

    const seed: DeepDiveSeed | undefined =
      sourceMode === "seed" && pickedRoute
        ? {
            title: pickedRoute.title,
            angle: pickedRoute.route.angle,
            treatment: pickedRoute.route.treatment,
          }
        : undefined;

    try {
      mark("deep", "running");
      const dd = await runDeepDive(activeGenre, count, seed);
      setFindings(dd.findings);
      mark("deep", "done", `${dd.findings.length} findings`);

      mark("organize", "running");
      const org = await runOrganize(dd.findings);
      const initial: StoryResult[] = org.stories.map((s) => ({ story: s }));
      setStories(initial);
      setOpenStoryId(initial[0]?.story.id ?? null);
      mark("organize", "done", `${org.stories.length} stories`);

      mark("script", "running");
      const scripts = await Promise.all(
        org.stories.map((s) =>
          runScript(s).then(
            (sc) => ({ id: s.id, ok: true as const, script: sc }),
            (e) => ({ id: s.id, ok: false as const, error: String(e) }),
          ),
        ),
      );
      setStories((prev) =>
        prev.map((sr) => {
          const r = scripts.find((x) => x.id === sr.story.id);
          if (!r) return sr;
          return r.ok ? { ...sr, script: r.script } : { ...sr, error: r.error };
        }),
      );
      const okScripts = scripts.filter((r) => r.ok).length;
      mark("script", "done", `${okScripts}/${scripts.length} scripts`);

      mark("clusters", "running");
      const clustered = await Promise.all(
        scripts.map(async (r) => {
          if (!r.ok) return { id: r.id, ok: false as const, error: r.error };
          try {
            const c = await runClusters(r.script.script);
            return { id: r.id, ok: true as const, clusters: c.clusters };
          } catch (e) {
            return { id: r.id, ok: false as const, error: String(e) };
          }
        }),
      );
      setStories((prev) =>
        prev.map((sr) => {
          const r = clustered.find((x) => x.id === sr.story.id);
          if (!r || !r.ok) return sr;
          return { ...sr, clusters: r.clusters };
        }),
      );
      const okClusters = clustered.filter((r) => r.ok).length;
      mark("clusters", "done", `${okClusters}/${clustered.length} clustered`);
    } catch (e) {
      const msg = String(e);
      setError(msg);
      const currentRunning = Object.entries(stageState).find(([, v]) => v === "running")?.[0];
      if (currentRunning) mark(currentRunning, "error", msg.slice(0, 80));
    } finally {
      setRunning(false);
    }
  }

  const stages: Stage[] = [
    { key: "deep", label: "Deep Diver", state: stageState.deep, detail: stageDetail.deep },
    { key: "organize", label: "Organizer", state: stageState.organize, detail: stageDetail.organize },
    { key: "script", label: "Script Writer", state: stageState.script, detail: stageDetail.script },
    { key: "clusters", label: "Cluster Analyzer", state: stageState.clusters, detail: stageDetail.clusters },
  ];

  const openStory = stories.find((s) => s.story.id === openStoryId);
  const seedReady = sourceMode === "seed" && !!pickedRoute;

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-text-muted">YTauto</div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Studio</h1>
        <p className="text-text-muted text-sm mt-1 max-w-prose">
          Forge a title → map routes → deep dive. Or skip ahead and just pick a
          genre. The pipeline takes whichever you give it.
        </p>
      </header>

      <div className="space-y-6">
        <TitleForgeSection picked={pickedTitle} onPick={setPickedTitle} />

        <RouteMapperSection
          initialTitle={pickedTitle?.text ?? ""}
          picked={pickedRoute}
          onPick={(route, title) => setPickedRoute({ route, title })}
        />

        <section className="bg-bg-card border border-line rounded-xl p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Pipeline</h2>
              <p className="text-xs text-text-muted">
                Deep diver → organizer → script writer → cluster analyzer.
              </p>
            </div>
          </div>

          {/* Source selector */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setSourceMode("genre")}
              className={[
                "px-3 py-1.5 rounded-md text-sm border transition",
                sourceMode === "genre"
                  ? "border-accent bg-accent/10 text-text"
                  : "border-line bg-bg-elevated text-text-muted hover:text-text",
              ].join(" ")}
            >
              Source: Genre
            </button>
            <button
              onClick={() => setSourceMode("seed")}
              disabled={!pickedRoute}
              className={[
                "px-3 py-1.5 rounded-md text-sm border transition disabled:opacity-40 disabled:cursor-not-allowed",
                sourceMode === "seed" && pickedRoute
                  ? "border-accent bg-accent/10 text-text"
                  : "border-line bg-bg-elevated text-text-muted hover:text-text",
              ].join(" ")}
              title={!pickedRoute ? "Pick a route above to enable" : undefined}
            >
              Source: Title + Route
            </button>
          </div>

          {/* Source summary */}
          <div className="mb-4 text-sm">
            {seedReady && pickedRoute ? (
              <div className="rounded-lg border border-line bg-bg-elevated p-3">
                <div className="text-[10px] uppercase tracking-widest text-text-muted">
                  Using
                </div>
                <div className="font-medium mt-0.5 truncate">{pickedRoute.title}</div>
                <div className="text-xs text-text-muted mt-1">
                  <span className="text-accent">{pickedRoute.route.label}</span> —{" "}
                  {pickedRoute.route.angle}
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  genre context: {activeGenre}
                </div>
              </div>
            ) : (
              <GenreSelector
                genres={genres}
                active={activeGenre}
                onSelect={setActiveGenre}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="text-sm text-text-muted flex items-center gap-2">
              {seedReady ? "Sub-stories" : "Stories per video"}
              <input
                type="number"
                min={1}
                max={8}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                className="w-16 bg-bg-elevated border border-line rounded-md px-2 py-1 text-text text-sm"
              />
            </label>
            {seedReady && (
              <label className="text-sm text-text-muted flex items-center gap-2">
                Genre context
                <select
                  value={activeGenre}
                  onChange={(e) => setActiveGenre(e.target.value)}
                  className="bg-bg-elevated border border-line rounded-md px-2 py-1 text-text text-sm"
                >
                  {genres.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              onClick={run}
              disabled={running || (!activeGenre && !seedReady)}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {running ? "Running pipeline…" : "Run pipeline"}
            </button>
            {error && <span className="text-xs text-accent break-all">{error}</span>}
          </div>

          <PipelineStages stages={stages} />
        </section>

        {findings.length > 0 && stories.length === 0 && (
          <section>
            <h2 className="text-sm uppercase tracking-widest text-text-muted mb-2">
              Findings
            </h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {findings.map((f, i) => (
                <li key={i} className="bg-bg-card border border-line rounded-xl p-4">
                  <div className="font-semibold">{f.working_title}</div>
                  <div className="text-sm text-text-muted mt-1">{f.hook}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stories.length > 0 && (
          <section>
            <div className="flex flex-wrap gap-2 mb-4">
              {stories.map((sr) => {
                const isOpen = openStoryId === sr.story.id;
                return (
                  <button
                    key={sr.story.id}
                    onClick={() => setOpenStoryId(sr.story.id)}
                    className={[
                      "px-3 py-1.5 rounded-md text-sm border transition",
                      isOpen
                        ? "border-accent bg-accent/10 text-text"
                        : "border-line bg-bg-card text-text-muted hover:text-text",
                    ].join(" ")}
                  >
                    {sr.story.title}
                  </button>
                );
              })}
            </div>

            {openStory && (
              <div className="space-y-4">
                <div className="bg-bg-card border border-line rounded-xl p-5">
                  <div className="text-xs uppercase tracking-widest text-text-muted">
                    Logline
                  </div>
                  <p className="mt-1 text-sm">{openStory.story.logline}</p>
                  {openStory.story.tone_hint && (
                    <div className="mt-3 text-xs text-text-muted">
                      Tone: <span className="text-text">{openStory.story.tone_hint}</span>
                    </div>
                  )}
                </div>

                {openStory.error && (
                  <div className="p-4 rounded-lg border border-accent/40 bg-accent/10 text-sm break-all">
                    {openStory.error}
                  </div>
                )}

                {openStory.script && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-lg font-semibold">{openStory.script.title}</h3>
                      <div className="text-xs text-text-muted">
                        {openStory.script.word_count} words · ~
                        {openStory.script.target_seconds}s
                      </div>
                    </div>
                    {openStory.clusters ? (
                      <ScriptClusterView
                        script={openStory.script.script}
                        clusters={openStory.clusters}
                      />
                    ) : (
                      <div className="bg-bg-card border border-line rounded-xl p-5 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {openStory.script.script}
                      </div>
                    )}
                  </div>
                )}

                {!openStory.script && !openStory.error && (
                  <div className="text-sm text-text-muted">
                    Script not generated yet. Run the pipeline.
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
