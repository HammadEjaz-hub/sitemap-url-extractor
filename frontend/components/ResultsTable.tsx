"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Search,
  SearchX,
} from "lucide-react";
import type { SitemapInfo, UrlEntry } from "@/lib/api";
import { copyText, downloadCsv, downloadTxt } from "@/lib/export";
import { cn } from "@/lib/cn";

type SortKey = "url-asc" | "url-desc" | "lastmod-new" | "lastmod-old";

const PAGE_SIZES = [25, 50, 100];

function shortHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function ResultsTable({
  urls,
  sitemaps,
}: {
  urls: UrlEntry[];
  sitemaps: SitemapInfo[];
}) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("url-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState("");

  const sources = useMemo(
    () => Array.from(new Set(urls.map((u) => u.source_sitemap))),
    [urls]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = urls
      .map((u, i) => ({ ...u, _i: i }))
      .filter((r) => (sourceFilter === "all" ? true : r.source_sitemap === sourceFilter))
      .filter((r) => (!q ? true : r.url.toLowerCase().includes(q)));
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "url-asc":
          return a.url.localeCompare(b.url);
        case "url-desc":
          return b.url.localeCompare(a.url);
        case "lastmod-new":
          return (b.lastmod ?? "").localeCompare(a.lastmod ?? "");
        case "lastmod-old":
          return (a.lastmod ?? "").localeCompare(b.lastmod ?? "");
      }
    });
    return rows;
  }, [urls, query, sourceFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pageSelected = pageRows.filter((r) => selected.has(r._i));
  const allPageSelected = pageRows.length > 0 && pageSelected.length === pageRows.length;

  function toggleRow(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageRows.forEach((r) => next.delete(r._i));
      else pageRows.forEach((r) => next.add(r._i));
      return next;
    });
  }

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function doCopy(text: string, label: string) {
    const ok = await copyText(text);
    flash(ok ? label : "Copy failed in this browser.");
  }

  const selectedRows = useMemo(
    () => urls.filter((_, i) => selected.has(i)),
    [urls, selected]
  );
  const uniqueRows = useMemo(() => {
    const seen = new Set<string>();
    return filtered.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
  }, [filtered]);

  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
      {/* toolbar */}
      <div className="space-y-3 border-b border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <label htmlFor="url-search" className="sr-only">Search URLs</label>
            <input
              id="url-search"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search URLs..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="source-filter" className="sr-only">Filter by source sitemap</label>
            <select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All sitemaps</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {shortHost(s)}
                </option>
              ))}
            </select>
            <label htmlFor="sort" className="sr-only">Sort URLs</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="url-asc">URL: A → Z</option>
              <option value="url-desc">URL: Z → A</option>
              <option value="lastmod-new">Last mod: newest</option>
              <option value="lastmod-old">Last mod: oldest</option>
            </select>
          </div>
        </div>

        {/* export bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Export
          </span>
          <ExportBtn
            icon={Copy}
            label={`Copy all (${filtered.length.toLocaleString()})`}
            onClick={() => doCopy(filtered.map((r) => r.url).join("\n"), `Copied ${filtered.length.toLocaleString()} URLs`)}
            disabled={filtered.length === 0}
          />
          <ExportBtn
            icon={Check}
            label={`Copy selected (${selected.size.toLocaleString()})`}
            onClick={() => doCopy(selectedRows.map((r) => r.url).join("\n"), `Copied ${selected.size.toLocaleString()} URLs`)}
            disabled={selected.size === 0}
          />
          <ExportBtn
            icon={Download}
            label="TXT"
            onClick={() => {
              downloadTxt(filtered.map((r) => r.url));
              flash("TXT downloaded");
            }}
            disabled={filtered.length === 0}
          />
          <ExportBtn
            icon={Download}
            label="CSV"
            onClick={() => {
              downloadCsv(filtered, false);
              flash("CSV downloaded");
            }}
            disabled={filtered.length === 0}
          />
          <ExportBtn
            icon={Download}
            label="CSV + metadata"
            onClick={() => {
              downloadCsv(filtered, true, "urls-metadata");
              flash("Metadata CSV downloaded");
            }}
            disabled={filtered.length === 0}
          />
          <ExportBtn
            icon={Download}
            label="Unique TXT"
            onClick={() => {
              downloadTxt(uniqueRows.map((r) => r.url), "unique-urls");
              flash("Unique URLs downloaded");
            }}
            disabled={uniqueRows.length === 0}
          />
          {notice && (
            <span role="status" className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {notice}
            </span>
          )}
        </div>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
            <SearchX className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-semibold text-gray-800">No URLs match your filters</p>
          <p className="mt-1 text-sm text-gray-400">Try a different search term or sitemap.</p>
        </div>
      ) : (
        <div className="nice-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50/95 backdrop-blur">
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Select all URLs on this page"
                    className="h-4 w-4 rounded accent-brand-600"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    URL <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </span>
                </th>
                <th className="px-4 py-3 font-semibold">Source sitemap</th>
                <th className="px-4 py-3 font-semibold">Last modified</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, n) => (
                <tr
                  key={r._i}
                  className={cn(
                    "border-b border-gray-50 transition-colors last:border-0 hover:bg-brand-50/50",
                    selected.has(r._i) && "bg-brand-50/70"
                  )}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(r._i)}
                      onChange={() => toggleRow(r._i)}
                      aria-label={`Select ${r.url}`}
                      className="h-4 w-4 rounded accent-brand-600"
                    />
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-gray-400">
                    {(safePage - 1) * pageSize + n + 1}
                  </td>
                  <td className="max-w-[320px] px-4 py-2.5">
                    <span className="block truncate font-medium text-gray-800" title={r.url}>
                      {r.url}
                    </span>
                  </td>
                  <td className="max-w-[180px] px-4 py-2.5">
                    <span className="block truncate text-gray-500" title={r.source_sitemap}>
                      {shortHost(r.source_sitemap)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-500">
                    {r.lastmod ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => doCopy(r.url, "URL copied")}
                        title="Copy URL"
                        aria-label={`Copy ${r.url}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-100 hover:text-brand-700"
                      >
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                        aria-label={`Open ${r.url} in new tab`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-100 hover:text-brand-700"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
        <p className="text-xs text-gray-400" role="status">
          Showing {from.toLocaleString()}–{to.toLocaleString()} of {filtered.length.toLocaleString()} URLs
          {selected.size > 0 && ` · ${selected.size.toLocaleString()} selected`}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-xs text-gray-400">Rows</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs font-semibold text-gray-700">
            {safePage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage >= pageCount}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
