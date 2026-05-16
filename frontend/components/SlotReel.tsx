"use client";

import { useEffect, useRef, useState } from "react";
import type { TitleCandidate } from "@/lib/types";

const NOISE_POOL = [
  "the secret history of",
  "what nobody told you about",
  "the man who tried to",
  "we found something weird in",
  "why everyone is wrong about",
  "the lawsuit that broke",
  "the bug that ate",
  "the email that changed",
  "the day the internet",
  "this should not have worked",
  "the room you can't enter",
  "a quiet disaster in",
  "the wrong answer that won",
  "they buried this on purpose",
  "the most boring genius",
];

type Props = {
  spinning: boolean;
  revealDelayMs: number;
  result: TitleCandidate | null;
  index: number;
  onPick?: (title: TitleCandidate) => void;
  isPicked?: boolean;
};

export function SlotReel({ spinning, revealDelayMs, result, index, onPick, isPicked }: Props) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "revealed">(
    spinning ? "spinning" : result ? "revealed" : "idle",
  );
  const [noise, setNoise] = useState(NOISE_POOL[index % NOISE_POOL.length]);
  const noiseInterval = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    if (spinning) {
      setPhase("spinning");
      noiseInterval.current = window.setInterval(() => {
        setNoise(NOISE_POOL[Math.floor(Math.random() * NOISE_POOL.length)]);
      }, 80);
    }
    return () => {
      if (noiseInterval.current) window.clearInterval(noiseInterval.current);
    };
  }, [spinning]);

  useEffect(() => {
    if (!spinning && result) {
      revealTimer.current = window.setTimeout(() => {
        setPhase("revealed");
        if (noiseInterval.current) {
          window.clearInterval(noiseInterval.current);
          noiseInterval.current = null;
        }
      }, revealDelayMs);
    }
    return () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
    };
  }, [spinning, result, revealDelayMs]);

  const showFinal = phase === "revealed" && result;

  return (
    <div
      className={[
        "relative bg-bg-card border rounded-xl overflow-hidden transition-all",
        isPicked
          ? "border-accent shadow-[0_0_0_2px_#ff3d5755]"
          : showFinal
            ? "border-accent/60"
            : "border-line",
      ].join(" ")}
    >
      <div className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-text-muted">
        Reel {index + 1}
      </div>
      <div className="min-h-[88px] px-4 pt-7 pb-4 flex items-center">
        {showFinal ? (
          <div className="w-full animate-[reveal_0.4s_ease-out]">
            <div className="font-semibold text-base leading-tight">
              {result!.text}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
              <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-line">
                {result!.hook_style || "—"}
              </span>
              <span className="truncate">{result!.reasoning}</span>
            </div>
          </div>
        ) : (
          <div className="font-mono text-sm text-text-muted blur-[1px] animate-[shake_0.15s_linear_infinite]">
            {noise}…
          </div>
        )}
      </div>
      {showFinal && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(result!.text)}
            className="text-[10px] uppercase tracking-widest text-text-muted hover:text-text"
            title="Copy title"
          >
            copy
          </button>
          {onPick && (
            <button
              onClick={() => onPick(result!)}
              className={[
                "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border",
                isPicked
                  ? "bg-accent text-white border-accent"
                  : "border-line text-text-muted hover:text-text hover:border-text-muted",
              ].join(" ")}
            >
              {isPicked ? "picked" : "use this"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
