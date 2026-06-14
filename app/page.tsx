"use client";

import { createElement, useCallback, useEffect, useState } from "react";
import {
  Music,
  Hash,
  PlayCircle,
  Sparkles,
  Loader2,
  History,
  Database,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { PLATFORM_LIST, type DisplayField, type PlatformDef } from "@/lib/platforms";

/* ---------- static maps (Tailwind needs literal class names) ---------- */

const ICONS: Record<string, LucideIcon> = { Music, Hash, PlayCircle };

const ACCENT: Record<
  string,
  { text: string; border: string; chip: string; chipOn: string }
> = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    chip: "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
    chipOn: "bg-emerald-500/15 border-emerald-400 text-emerald-200",
  },
  pink: {
    text: "text-pink-400",
    border: "border-pink-500/40",
    chip: "border-pink-500/30 text-pink-300 hover:bg-pink-500/10",
    chipOn: "bg-pink-500/15 border-pink-400 text-pink-200",
  },
  red: {
    text: "text-red-400",
    border: "border-red-500/40",
    chip: "border-red-500/30 text-red-300 hover:bg-red-500/10",
    chipOn: "bg-red-500/15 border-red-400 text-red-200",
  },
};

const fallbackAccent = ACCENT.emerald;
const accentOf = (p: PlatformDef) => ACCENT[p.accent] ?? fallbackAccent;

/** Stable component that renders a platform icon by name (avoids creating
 *  a component during render, which the react-hooks lint rules forbid). */
function PlatformGlyph({ name, className }: { name?: string; className?: string }) {
  return createElement(ICONS[name ?? ""] ?? Music, { className });
}

/* ---------- types ---------- */

type ApiResult =
  | { platform: string; ok: true; from_cache: boolean; output: Record<string, unknown> }
  | { platform: string; ok: false; error: string };

interface HistoryRow {
  id: string;
  prompt: string;
  platform: string;
  output: Record<string, unknown>;
  from_cache: boolean;
  created_at: string;
}

/* ---------- field renderer (generic, driven by platform.display) ---------- */

function Field({ field, value }: { field: DisplayField; value: unknown }) {
  if (value == null) return null;

  switch (field.kind) {
    case "title":
      return <h4 className="text-lg font-semibold leading-snug">{String(value)}</h4>;
    case "badge":
      return (
        <span className="inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium">
          {String(value)}
        </span>
      );
    case "number":
      return (
        <div className="text-sm">
          <span className="text-white/40">{field.label}: </span>
          <span className="font-mono">{String(value)}</span>
        </div>
      );
    case "tags":
      return (
        <div className="flex flex-wrap gap-1.5">
          {(value as unknown[]).map((t, i) => (
            <span
              key={i}
              className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/70 ring-1 ring-white/10"
            >
              {String(t)}
            </span>
          ))}
        </div>
      );
    case "text":
    default:
      return <p className="text-sm leading-relaxed text-white/70">{String(value)}</p>;
  }
}

function OutputCard({
  platform,
  output,
  fromCache,
}: {
  platform: PlatformDef;
  output: Record<string, unknown>;
  fromCache?: boolean;
}) {
  const accent = accentOf(platform);
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-white/[0.03] p-5 ${accent.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformGlyph name={platform.icon} className={`h-4 w-4 ${accent.text}`} />
          <span className="font-medium">{platform.label}</span>
        </div>
        {fromCache && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
            <Database className="h-3 w-3" /> cached fallback
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {platform.display.map((f) => (
          <Field key={f.key} field={f} value={output[f.key]} />
        ))}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string[]>(["spotify", "tiktok", "youtube"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ApiResult[] | null>(null);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  const byId = (id: string) => PLATFORM_LIST.find((p) => p.id === id);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const loadHistory = useCallback(async (filter: string) => {
    const qs = filter === "all" ? "" : `?platform=${filter}`;
    const res = await fetch(`/api/history${qs}`);
    const data = await res.json();
    setHistory(data.history ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await loadHistory(historyFilter);
    })();
  }, [historyFilter, loadHistory]);

  async function generate() {
    if (!prompt.trim() || selected.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, target_platforms: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setResults(data.results);
      loadHistory(historyFilter);
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 text-white">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Sparkles className="h-4 w-4" /> Melotech
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Distribution Pipeline</h1>
        <p className="mt-1 text-white/50">
          One music concept → platform-optimized outputs, generated in parallel.
        </p>
      </header>

      {/* Composer */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the track — e.g. 'lo-fi synthwave for late-night coding, nostalgic and warm'"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-white/40">Platforms</span>
          {PLATFORM_LIST.map((p) => {
            const on = selected.includes(p.id);
            const accent = accentOf(p);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                  on ? accent.chipOn : `border-white/10 text-white/60 ${accent.chip}`
                }`}
              >
                <PlatformGlyph name={p.icon} className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={generate}
          disabled={loading || !prompt.trim() || selected.length === 0}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : "Generate"}
        </button>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
      </section>

      {/* Comparison */}
      {results && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">
            Comparison
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => {
              const p = byId(r.platform);
              if (!p) return null;
              if (!r.ok)
                return (
                  <div
                    key={r.platform}
                    className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300"
                  >
                    <div className="mb-1 font-medium">{p.label}</div>
                    {r.error}
                  </div>
                );
              return (
                <OutputCard
                  key={r.platform}
                  platform={p}
                  output={r.output}
                  fromCache={r.from_cache}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* History */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/40">
            <History className="h-4 w-4" /> History
          </h2>
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm outline-none"
          >
            <option value="all">All platforms</option>
            {PLATFORM_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/30">
            No generations yet{historyFilter !== "all" ? " for this platform" : ""}.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((row) => {
              const p = byId(row.platform);
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm"
                >
                  <PlatformGlyph
                    name={p?.icon}
                    className={`h-4 w-4 ${p ? accentOf(p).text : "text-white/40"}`}
                  />
                  <span className="w-20 shrink-0 text-white/40">{p?.label ?? row.platform}</span>
                  <span className="flex-1 truncate text-white/70">{row.prompt}</span>
                  {row.from_cache && (
                    <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">
                      cached
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-white/30">
                    {new Date(row.created_at).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
