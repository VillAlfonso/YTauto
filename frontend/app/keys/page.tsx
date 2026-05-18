"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activateKey,
  addKey,
  deactivateKey,
  deleteKey,
  fetchKeys,
  resetKey,
} from "@/lib/api";
import type { APIKey } from "@/lib/types";

export default function KeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [label, setLabel] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setKeys(await fetchKeys());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!keyValue.trim()) return;
    setError(null);
    setAdding(true);
    try {
      await addKey(label, keyValue.trim());
      setLabel("");
      setKeyValue("");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setAdding(false);
    }
  }

  async function action(
    id: string,
    fn: (id: string) => Promise<unknown>,
  ) {
    setBusyId(id);
    setError(null);
    try {
      await fn(id);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"? This can't be undone.`)) return;
    await action(id, deleteKey);
  }

  const hasActive = keys.some((k) => k.active && !k.exhausted);
  const allExhausted = keys.length > 0 && keys.every((k) => k.exhausted);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 max-w-3xl mx-auto">
      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-text-muted">YTauto</div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">API Keys</h1>
        <p className="text-text-muted text-sm mt-1 max-w-prose">
          Gemini keys for the image generator. Add multiple, activate one, and
          if it returns a quota error (401 / 403 / 429) the system marks it
          exhausted and automatically activates the next available key.
        </p>
      </header>

      {keys.length > 0 && !hasActive && (
        <div className="rounded-lg border border-line bg-bg-elevated/40 p-3 text-sm mb-4">
          {allExhausted ? (
            <>
              <strong>All keys exhausted.</strong> Image generation will use
              placeholder stubs until you reset one (after the quota resets) or
              add a new key.
            </>
          ) : (
            <>
              <strong>No active key.</strong> Image generation will use
              placeholder stubs. Activate a key below to use real Gemini.
            </>
          )}
        </div>
      )}

      <form
        onSubmit={onAdd}
        className="bg-bg-card border border-line rounded-xl p-4 mb-6"
      >
        <h2 className="font-semibold text-sm mb-3">Add a key</h2>
        <div className="space-y-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional, e.g. 'work account')"
            className="w-full bg-bg-elevated border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <input
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder="AIza..."
            type="password"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-bg-elevated border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={adding || !keyValue.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add key"}
            </button>
            <p className="text-[11px] text-text-muted">
              Keys are stored locally in <code>backend/keys.json</code>{" "}
              (gitignored). Never leaves your machine.
            </p>
          </div>
          {error && (
            <div className="text-xs text-accent break-all mt-1">{error}</div>
          )}
        </div>
      </form>

      <h2 className="font-semibold text-sm mb-3">Keys ({keys.length})</h2>
      {keys.length === 0 ? (
        <div className="bg-bg-card border border-line rounded-xl text-sm text-text-muted py-8 text-center">
          No keys yet. Add one above to generate real images.
        </div>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => {
            const status: { label: string; cls: string } = k.active
              ? {
                  label: "Active",
                  cls: "bg-accent/15 border-accent text-accent",
                }
              : k.exhausted
                ? {
                    label: "Exhausted",
                    cls: "bg-bg-elevated border-line text-text-muted",
                  }
                : {
                    label: "Idle",
                    cls: "bg-bg-elevated border-line text-text-muted",
                  };
            const isBusy = busyId === k.id;
            return (
              <li
                key={k.id}
                className="bg-bg-card border border-line rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{k.label}</div>
                    <div className="font-mono text-xs text-text-muted">
                      {k.key_preview}
                    </div>
                    {k.last_error && (
                      <div className="text-[11px] text-accent mt-1 break-all">
                        last error: {k.last_error}
                      </div>
                    )}
                    {k.last_used_at && (
                      <div className="text-[10px] text-text-muted mt-1">
                        last used: {new Date(k.last_used_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span
                    className={[
                      "shrink-0 text-[10px] uppercase tracking-widest px-2 py-1 rounded border",
                      status.cls,
                    ].join(" ")}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {k.active ? (
                    <button
                      onClick={() => action(k.id, deactivateKey)}
                      disabled={isBusy}
                      className="text-[11px] px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => action(k.id, activateKey)}
                      disabled={isBusy}
                      className="text-[11px] px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}
                  {k.exhausted && (
                    <button
                      onClick={() => action(k.id, resetKey)}
                      disabled={isBusy}
                      className="text-[11px] px-2 py-1 rounded border border-line text-text-muted hover:text-text hover:border-text-muted disabled:opacity-50"
                      title="Clear the exhausted flag — use when you know the quota has reset"
                    >
                      Clear exhausted
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(k.id, k.label)}
                    disabled={isBusy}
                    className="text-[11px] px-2 py-1 rounded border border-line text-text-muted hover:text-accent hover:border-accent disabled:opacity-50 ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
