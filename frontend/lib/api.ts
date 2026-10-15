export interface UrlEntry {
  url: string;
  source_sitemap: string;
  lastmod: string | null;
}

export interface SitemapInfo {
  url: string;
  status: string;
  is_index: boolean;
  url_count: number;
  error: string | null;
}

export interface Stats {
  total_urls: number;
  unique_urls: number;
  duplicate_entries: number;
  sitemaps_processed: number;
  with_lastmod: number;
  lastmod_coverage: string;
}

export interface Analysis {
  https_count: number;
  http_count: number;
  with_query_params: number;
  trailing_slash: number;
  no_trailing_slash: number;
  path_depth: Record<string, number>;
  common_prefixes: { prefix: string; count: number }[];
}

export interface Issue {
  type: string;
  severity: "error" | "warning";
  message: string;
  sitemap: string | null;
}

export interface DuplicateInfo {
  url: string;
  occurrences: number;
  sources: string[];
}

export interface LimitsInfo {
  max_sitemaps: number;
  max_urls: number;
  max_depth: number;
  max_response_bytes: number;
  truncated: boolean;
}

export interface ExtractResponse {
  input_url: string;
  resolved_url: string;
  discovered_via: string;
  sitemaps: SitemapInfo[];
  urls: UrlEntry[];
  stats: Stats;
  analysis: Analysis;
  duplicates: DuplicateInfo[];
  issues: Issue[];
  limits: LimitsInfo;
}

export async function extractSitemap(input: string): Promise<ExtractResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let res: Response;
  try {
    res = await fetch(`${base}/api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input }),
    });
  } catch {
    throw new Error(
      "Could not reach the extraction service. Please check your connection and try again."
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" && detail.length > 0
        ? detail
        : `Extraction failed (HTTP ${res.status}). Please try again.`
    );
  }
  return (await res.json()) as ExtractResponse;
}
