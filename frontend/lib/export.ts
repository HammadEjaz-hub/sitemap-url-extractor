import type { UrlEntry } from "./api";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(
    d.getMinutes()
  )}`;
}

function csvCell(value: string | null): string {
  const v = value ?? "";
  // Prevent spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / denied permissions.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadTxt(urls: string[], label = "urls") {
  download(`sitemap-${label}-${stamp()}.txt`, urls.join("\n") + "\n", "text/plain;charset=utf-8");
}

export function downloadCsv(rows: UrlEntry[], withMeta: boolean, label = "urls") {
  const header = withMeta ? ["url", "source_sitemap", "lastmod"] : ["url"];
  const lines = [header.map((h) => csvCell(h)).join(",")];
  for (const r of rows) {
    lines.push(
      withMeta
        ? [csvCell(r.url), csvCell(r.source_sitemap), csvCell(r.lastmod)].join(",")
        : csvCell(r.url)
    );
  }
  // UTF-8 BOM so Excel opens the file correctly.
  download(
    `sitemap-${label}-${stamp()}.csv`,
    "\uFEFF" + lines.join("\r\n") + "\r\n",
    "text/csv;charset=utf-8"
  );
}
