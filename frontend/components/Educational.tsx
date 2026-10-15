"use client";

import { FileCode2, Files, FolderTree, Package } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

const BENEFITS = [
  {
    title: "SEO audits",
    text: "Compare submitted URLs against indexed pages to find coverage gaps and crawl issues.",
  },
  {
    title: "URL inventory",
    text: "Get a complete, exportable list of a site's pages for content planning and analysis.",
  },
  {
    title: "Website migrations",
    text: "Export every URL before a migration to map redirects and avoid losing traffic.",
  },
  {
    title: "Content planning",
    text: "See the full content structure at a glance and spot thin or missing topic areas.",
  },
  {
    title: "Sitemap troubleshooting",
    text: "Find invalid XML, empty sitemaps, broken references and duplicate entries fast.",
  },
  {
    title: "Technical SEO workflows",
    text: "Feed clean URL lists into crawlers like Screaming Frog or your own scripts.",
  },
];

const FORMATS = [
  {
    icon: FileCode2,
    title: "XML sitemap",
    text: "The standard format listing up to 50,000 URLs with optional metadata like lastmod.",
    code: "sitemap.xml",
  },
  {
    icon: Files,
    title: "Sitemap index",
    text: "A sitemap of sitemaps, used by larger sites to organize many sitemap files.",
    code: "sitemap_index.xml",
  },
  {
    icon: FolderTree,
    title: "Nested sitemap index",
    text: "Index files that reference further indexes — processed recursively to any depth.",
    code: "sitemap_index.xml → child indexes",
  },
  {
    icon: Package,
    title: "GZIP-compressed sitemap",
    text: "Sitemaps compressed to save bandwidth; decompressed automatically before parsing.",
    code: "sitemap.xml.gz",
  },
];

export default function Educational() {
  return (
    <section id="learn" className="scroll-mt-20 bg-brand-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Learn"
          title="Sitemap Extraction, Explained"
        />

        <Reveal className="mx-auto max-w-3xl">
          <h3 className="text-xl font-bold text-gray-900">What Is a Sitemap URL Extractor?</h3>
          <p className="mt-3 leading-relaxed text-gray-500">
            A sitemap URL extractor reads a website&apos;s XML sitemap and turns it into a
            clean, searchable list of every page URL it contains. Instead of opening raw XML
            — or manually copying hundreds of addresses — you paste one sitemap URL and get
            an organized dashboard with statistics, filters and one-click exports. It works
            with standard sitemaps, sitemap indexes, nested indexes and compressed files.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 max-w-5xl">
          <Reveal>
            <h3 className="text-center text-xl font-bold text-gray-900">
              Why Use a Sitemap URL Extractor?
            </h3>
          </Reveal>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 0.07}>
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
                  <h4 className="text-sm font-bold text-gray-900">{b.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-5xl">
          <Reveal>
            <h3 className="text-center text-xl font-bold text-gray-900">Supported Sitemap Types</h3>
          </Reveal>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {FORMATS.map((f, i) => (
              <Reveal key={f.title} delay={(i % 2) * 0.07}>
                <div className="flex h-full gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{f.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{f.text}</p>
                    <code className="mt-2 inline-block rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-brand-700">
                      {f.code}
                    </code>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
