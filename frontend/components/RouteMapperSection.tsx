"use client";

import { useEffect, useState } from "react";
import { runRoutes } from "@/lib/api";
import type { Route } from "@/lib/types";

type Picked = { title: string; route: Route } | null;

type Props = {
  initialTitle: string;
  picked: Picked;
  onPick: (route: Route, title: string) => void;
};

export function RouteMapperSection({ initialTitle, picked, onPick }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the parent picks a new title upstream, replace the input so the user
  // doesn't have to retype — but don't clobber if they've started editing.
  const [autofilledFrom, setAutofilledFrom] = useState<string>("");
  useEffect(() => {
    if (initialTitle && initialTitle !== autofilledFrom) {
      setTitle(initialTitle);
      setAutofilledFrom(initialTitle);
      setRoutes(null);
    }
  }, [initialTitle, autofilledFrom]);

  async function findRoutes() {
    if (!title.trim() || loading) return;
    setError(null);
    setLoading(true);
    setRoutes(null);
    try {
      const r = await runRoutes(title.trim(), 4);
      setRoutes(r.routes);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-bg-card border border-line rounded-xl p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Route Mapper</h2>
        <p className="text-xs text-text-muted">
          Before deep-diving, scope the angles. Paste a title (or pick one above)
          and find a few directions this video could go.
        </p>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-text-muted">
          Title or topic
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the video about?"
          className="mt-2 w-full bg-bg-elevated border border-line rounded-lg p-3 text-sm focus:outline-none focus:border-accent"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={findRoutes}
          disabled={loading || !title.trim()}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50 hover:brightness-110"
        >
          {loading ? "Mapping…" : routes ? "Remap routes" : "Find routes"}
        </button>
        {error && <span className="text-xs text-accent break-all">{error}</span>}
      </div>

      {loading && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-bg-elevated border border-line animate-pulse"
            />
          ))}
        </div>
      )}

      {routes && !loading && (
        <ul className="mt-4 grid sm:grid-cols-2 gap-3">
          {routes.map((r) => {
            const isPicked =
              !!picked &&
              picked.title === title &&
              picked.route.id === r.id;
            return (
              <li
                key={r.id}
                className={[
                  "rounded-xl border p-4 transition cursor-pointer",
                  isPicked
                    ? "border-accent bg-accent/5 shadow-[0_0_0_2px_#ff3d5755]"
                    : "border-line bg-bg-elevated hover:border-text-muted",
                ].join(" ")}
                onClick={() => onPick(r, title)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-sm">{r.label}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-text-muted shrink-0">
                    {r.treatment || "—"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-snug">{r.angle}</p>
                {r.why_this_works && (
                  <p className="mt-2 text-xs text-text-muted italic">
                    {r.why_this_works}
                  </p>
                )}
                <div
                  className={[
                    "mt-3 text-[10px] uppercase tracking-widest",
                    isPicked ? "text-accent" : "text-text-muted",
                  ].join(" ")}
                >
                  {isPicked ? "picked — pipeline will use this" : "click to use"}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
