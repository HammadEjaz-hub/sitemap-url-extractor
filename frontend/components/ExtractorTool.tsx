"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ClipboardPaste,
  Link2,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { extractSitemap, type ExtractResponse } from "@/lib/api";
import ResultsDashboard from "./ResultsDashboard";
import { cn } from "@/lib/cn";

type Status = "idle" | "loading" | "done" | "error";

// Stage messages shown while the backend works. No fake percentages —
// these describe the phase, not measured progress.
const STAGES = [
  "Connecting to sitemap...",
  "Fetching XML data...",
  "Processing sitemap files...",
  "Extracting URLs...",
  "Preparing results...",
];

export default function ExtractorTool() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [fieldError, setFieldError] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function looksValid(value: string): boolean {
    const v = value.trim();
    if (!v) return false;
    // Accept bare domains ("example.com") and full URLs.
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v.replace(/^https?:\/\//i, ""));
  }

  async function handleExtract() {
    const value = input.trim();
    if (!looksValid(value)) {
      setFieldError("Please enter a valid sitemap URL or domain (e.g. example.com/sitemap.xml).");
      return;
    }
    setFieldError("");
    setError("");
    setStatus("loading");
    setStage(0);
    timer.current = setInterval(
      () => setStage((s) => (s + 1) % STAGES.length),
      2400
    );
    try {
      const data = await extractSitemap(value);
      setResult(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed. Please try again.");
      setStatus("error");
    } finally {
      if (timer.current) clearInterval(timer.current);
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text.trim());
        setFieldError("");
      }
    } catch {
      // Clipboard permission denied — user can paste manually.
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError("");
    setInput("");
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-pop sm:p-8">
      <AnimatePresence mode="wait">
        {status === "done" && result ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Extraction Results</h2>
                <p className="mt-0.5 truncate text-sm text-gray-500" title={result.resolved_url}>
                  {result.resolved_url}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                New extraction
              </button>
            </div>
            <ResultsDashboard result={result} />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Link2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Sitemap URL Extractor</h2>
                <p className="text-sm text-gray-500">
                  Paste a sitemap URL — or just a domain — and we&apos;ll do the rest.
                </p>
              </div>
            </div>

            <label htmlFor="sitemap-url" className="sr-only">
              Sitemap URL or domain
            </label>
            <div
              className={cn(
                "flex flex-col gap-3 sm:flex-row",
                status === "loading" && "pointer-events-none opacity-70"
              )}
            >
              <div className="relative flex-1">
                <input
                  id="sitemap-url"
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (fieldError) setFieldError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleExtract();
                  }}
                  placeholder="https://example.com/sitemap.xml"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={status === "loading"}
                  aria-invalid={fieldError ? "true" : undefined}
                  aria-describedby={fieldError ? "url-error" : undefined}
                  className={cn(
                    "h-13 w-full rounded-2xl border bg-gray-50 py-3.5 pl-4 pr-20 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none",
                    fieldError ? "border-red-300" : "border-gray-200"
                  )}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    <ClipboardPaste className="h-4.5 w-4.5" aria-hidden="true" />
                  </button>
                  {input && (
                    <button
                      type="button"
                      onClick={() => setInput("")}
                      title="Clear"
                      aria-label="Clear input"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X className="h-4.5 w-4.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleExtract}
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-7 py-3.5 text-[15px] font-semibold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-brand-600 disabled:translate-y-0 disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" aria-hidden="true" />
                    Extract Sitemap URLs
                  </>
                )}
              </button>
            </div>

            {fieldError && (
              <p id="url-error" role="alert" className="mt-2.5 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {fieldError}
              </p>
            )}

            {status === "loading" && (
              <div
                className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-5"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-4">
                  <span className="animate-pulse-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="truncate text-sm font-semibold text-brand-800"
                      >
                        {STAGES[stage]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="mt-0.5 text-xs text-brand-600/70">
                      Fetching and parsing the live sitemap — this can take a few seconds for large sites.
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brand-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    animate={{ x: ["-100%", "250%"] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "40%" }}
                  />
                </div>
              </div>
            )}

            {status === "error" && (
              <div
                className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Extraction failed</p>
                  <p className="mt-0.5 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                No sign-up required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                Supports sitemap indexes &amp; .xml.gz
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                Free CSV / TXT export
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
