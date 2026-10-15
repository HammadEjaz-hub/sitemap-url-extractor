"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CopyX,
  Files,
  FolderTree,
  Link2,
  ListChecks,
  OctagonAlert,
} from "lucide-react";
import type { ExtractResponse } from "@/lib/api";
import ResultsTable from "./ResultsTable";
import { cn } from "@/lib/cn";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  delay: number;
}) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-[13px] font-medium text-gray-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
        {typeof value === "number" ? animated.toLocaleString() : value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </motion.div>
  );
}

export default function ResultsDashboard({ result }: { result: ExtractResponse }) {
  const { stats, analysis, duplicates, issues, sitemaps } = result;
  const [structureOpen, setStructureOpen] = useState(false);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const httpsPct =
    stats.total_urls > 0 ? Math.round((analysis.https_count / stats.total_urls) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* discovery + truncation notices */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {result.discovered_via === "direct"
            ? "Direct sitemap URL"
            : result.discovered_via === "robots.txt"
              ? "Discovered via robots.txt"
              : "Discovered via common location"}
        </span>
        {result.limits.truncated && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Partial results — processing limits reached
          </span>
        )}
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard icon={Link2} label="Total URLs Found" value={stats.total_urls} delay={0} />
        <StatCard icon={ListChecks} label="Unique URLs" value={stats.unique_urls} delay={0.06} />
        <StatCard icon={CopyX} label="Duplicate Entries" value={stats.duplicate_entries} delay={0.12} />
        <StatCard icon={Files} label="Sitemaps Processed" value={stats.sitemaps_processed} delay={0.18} />
        <StatCard
          icon={CalendarClock}
          label="Last Modified"
          value={stats.lastmod_coverage}
          sub={
            stats.with_lastmod > 0
              ? `${stats.with_lastmod.toLocaleString()} URLs include a date`
              : "No dates in this sitemap"
          }
          delay={0.24}
        />
      </div>

      {/* issues */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2" role="region" aria-label="Extraction issues">
          {errors.map((i, n) => (
            <div key={n} className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <OctagonAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700">{i.message}</p>
                {i.sitemap && <p className="mt-0.5 truncate text-xs text-red-600/80">{i.sitemap}</p>}
              </div>
            </div>
          ))}
          {warnings.map((i, n) => (
            <div key={n} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Warning</p>
                <p className="text-amber-700">{i.message}</p>
                {i.sitemap && <p className="mt-0.5 truncate text-xs text-amber-600/80">{i.sitemap}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* table + exports */}
      <ResultsTable urls={result.urls} sitemaps={sitemaps} />

      {/* analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-900">URL Structure Analysis</h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">HTTPS URLs</dt>
              <dd className="font-semibold text-gray-900">
                {analysis.https_count.toLocaleString()} ({httpsPct}%)
              </dd>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${httpsPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">HTTP URLs</dt>
              <dd className="font-semibold text-gray-900">{analysis.http_count.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">With query parameters</dt>
              <dd className="font-semibold text-gray-900">{analysis.with_query_params.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Trailing slash</dt>
              <dd className="font-semibold text-gray-900">{analysis.trailing_slash.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">No trailing slash</dt>
              <dd className="font-semibold text-gray-900">{analysis.no_trailing_slash.toLocaleString()}</dd>
            </div>
          </dl>
          {analysis.common_prefixes.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Common path prefixes
              </p>
              <ul className="mt-2 space-y-1.5">
                {analysis.common_prefixes.slice(0, 5).map((p) => (
                  <li key={p.prefix} className="flex items-center justify-between text-sm">
                    <code className="truncate rounded bg-brand-50 px-2 py-0.5 font-mono text-xs text-brand-700">
                      {p.prefix}
                    </code>
                    <span className="font-semibold text-gray-700">{p.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-900">Path Depth Distribution</h3>
          {Object.keys(analysis.path_depth).length === 0 ? (
            <p className="mt-4 text-sm text-gray-400">No URLs to analyze.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {Object.entries(analysis.path_depth).map(([depth, count]) => {
                const pct = stats.total_urls > 0 ? (count / stats.total_urls) * 100 : 0;
                return (
                  <li key={depth}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Depth {depth} <span className="text-gray-400">({depth === "0" ? "homepage" : `${depth} segment${depth === "1" ? "" : "s"}`})</span>
                      </span>
                      <span className="font-semibold text-gray-900">{count.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* duplicates */}
      {duplicates.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-900">
            Duplicate URLs <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{duplicates.length}</span>
          </h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto nice-scroll pr-1">
            {duplicates.slice(0, 50).map((d) => (
              <li key={d.url} className="rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm">
                <p className="truncate font-medium text-gray-800" title={d.url}>{d.url}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {d.occurrences} occurrences · {d.sources.length} sitemap{d.sources.length === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
          {duplicates.length > 50 && (
            <p className="mt-2 text-xs text-gray-400">Showing 50 of {duplicates.length} duplicates.</p>
          )}
        </div>
      )}

      {/* sitemap structure */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-card">
        <button
          type="button"
          onClick={() => setStructureOpen((v) => !v)}
          aria-expanded={structureOpen}
          className="flex w-full items-center justify-between p-5 text-left"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold text-gray-900">
            <FolderTree className="h-4.5 w-4.5 text-brand-600" aria-hidden="true" />
            Sitemap Structure
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {sitemaps.length}
            </span>
          </span>
          <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", structureOpen && "rotate-180")} aria-hidden="true" />
        </button>
        {structureOpen && (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto nice-scroll border-t border-gray-100 p-4">
            {sitemaps.map((s, n) => (
              <li
                key={n}
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800" title={s.url}>{s.url}</p>
                  <p className="text-xs text-gray-400">
                    {s.is_index ? "Sitemap index" : `${s.url_count.toLocaleString()} URLs`}
                    {s.status === "error" && s.error ? ` · ${s.error}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    s.status === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}
                >
                  {s.status === "ok" ? "OK" : "Error"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
