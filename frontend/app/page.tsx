"use client";

import { useEffect, useState } from "react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { TrendCard } from "@/components/TrendCard";
import { fetchCategories, fetchTrends } from "@/lib/api";
import type { Category, TrendsResponse } from "@/lib/types";

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState<string>("tech");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length && !cats.find((c) => c.key === active)) {
          setActive(cats[0].key);
        }
      })
      .catch((e) => setError(String(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setError(null);
    fetchTrends(active)
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-text-muted">YTauto</div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Trend Engine</h1>
          <p className="text-text-muted text-sm mt-1 max-w-prose">
            High-retention 10-minute targets, ranked by engagement proxy score.
          </p>
        </div>
        {data && (
          <div className="text-xs text-text-muted">
            Updated {new Date(data.generated_at).toLocaleTimeString()}
          </div>
        )}
      </header>

      <CategoryFilter categories={categories} active={active} onSelect={setActive} />

      <section className="mt-6">
        {error && (
          <div className="p-4 rounded-lg border border-accent/40 bg-accent/10 text-sm">
            {error}
          </div>
        )}
        {loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-bg-card border border-line animate-pulse"
              />
            ))}
          </div>
        )}
        {!loading && data && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topics.map((t) => (
              <TrendCard key={t.query} topic={t} />
            ))}
          </div>
        )}
        {!loading && data && data.topics.length === 0 && (
          <div className="text-text-muted text-sm">
            No qualifying 8–12 minute videos in this category right now. Try another.
          </div>
        )}
      </section>
    </main>
  );
}
