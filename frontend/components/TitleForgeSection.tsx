"use client";

import { useState } from "react";
import { SlotReel } from "@/components/SlotReel";
import { runTitles } from "@/lib/api";
import type { TitleCandidate } from "@/lib/types";

const REEL_COUNT = 5;
const STAGGER_MS = 220;
const MIN_SPIN_MS = 1200;

type Props = {
  picked: TitleCandidate | null;
  onPick: (title: TitleCandidate) => void;
};

export function TitleForgeSection({ picked, onPick }: Props) {
  const [idea, setIdea] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<TitleCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pullLever() {
    if (!idea.trim() || spinning) return;
    setError(null);
    setResults(null);
    setSpinning(true);
    const startedAt = Date.now();
    try {
      const r = await runTitles(idea.trim(), REEL_COUNT);
      const wait = Math.max(0, MIN_SPIN_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        setResults(r.titles);
        setSpinning(false);
      }, wait);
    } catch (e) {
      setError(String(e));
      setSpinning(false);
    }
  }

  return (
    <section className="bg-bg-card border border-line rounded-xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Title Forge</h2>
          <p className="text-xs text-text-muted">
            Type a rough idea, pull the lever, get five title candidates.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-text-muted">
          Your idea
        </span>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. 'a guy patented sliced bread and nobody bought it for 16 years'"
          rows={3}
          className="mt-2 w-full bg-bg-elevated border border-line rounded-lg p-3 text-sm leading-relaxed resize-y focus:outline-none focus:border-accent"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={pullLever}
          disabled={spinning || !idea.trim()}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50 hover:brightness-110 active:animate-[pull_0.25s_ease-out]"
        >
          {spinning ? "Spinning…" : results ? "Pull again" : "Pull the lever"}
        </button>
        {error && <span className="text-xs text-accent break-all">{error}</span>}
      </div>

      {(spinning || results) && (
        <div className="mt-4 grid gap-2.5">
          {Array.from({ length: REEL_COUNT }, (_, i) => {
            const result = results?.[i] ?? null;
            const isPicked = !!(picked && result && picked.text === result.text);
            return (
              <SlotReel
                key={i}
                index={i}
                spinning={spinning}
                revealDelayMs={i * STAGGER_MS}
                result={result}
                onPick={onPick}
                isPicked={isPicked}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
