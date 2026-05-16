"use client";

export type StageState = "idle" | "running" | "done" | "error";

export type Stage = {
  key: string;
  label: string;
  state: StageState;
  detail?: string;
};

export function PipelineStages({ stages }: { stages: Stage[] }) {
  return (
    <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stages.map((s, i) => (
        <li
          key={s.key}
          className={[
            "rounded-xl border p-4 transition",
            s.state === "running" && "border-accent bg-accent/5 animate-pulse",
            s.state === "done" && "border-line bg-bg-card",
            s.state === "error" && "border-accent bg-accent/10",
            s.state === "idle" && "border-line bg-bg-card/50 opacity-60",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="text-[11px] uppercase tracking-widest text-text-muted">
            Stage {i + 1}
          </div>
          <div className="font-semibold mt-0.5">{s.label}</div>
          <div className="text-xs text-text-muted mt-2 h-4">
            {s.state === "running" && "running…"}
            {s.state === "done" && (s.detail ?? "complete")}
            {s.state === "error" && (s.detail ?? "error")}
            {s.state === "idle" && "waiting"}
          </div>
        </li>
      ))}
    </ol>
  );
}
