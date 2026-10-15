"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    q: "What is a sitemap URL extractor?",
    a: "A sitemap URL extractor reads a website's XML sitemap and lists every page URL it contains, so you can audit, analyze or export the full URL inventory without opening raw XML files.",
  },
  {
    q: "How do I extract URLs from a sitemap?",
    a: "Paste the sitemap URL into the extractor at the top of this page and click \u201CExtract Sitemap URLs\u201D. The tool fetches the sitemap, parses it, follows any nested sitemap indexes, and shows every URL in an interactive results table.",
  },
  {
    q: "Can I extract URLs from a sitemap index?",
    a: "Yes. Sitemap index files are detected automatically and every referenced child sitemap is fetched and processed recursively \u2014 including nested indexes, up to a safe recursion depth.",
  },
  {
    q: "Does this tool support WordPress sitemaps?",
    a: "Yes. WordPress sitemaps (including the /wp-sitemap.xml index format), Shopify sitemaps, custom XML sitemaps and gzip-compressed (.xml.gz) sitemaps are all supported.",
  },
  {
    q: "Can I download extracted URLs?",
    a: "Yes. Export all or selected URLs as TXT, or as CSV \u2014 plain or with metadata columns (source sitemap, lastmod) \u2014 ready for Excel, Google Sheets or Screaming Frog.",
  },
  {
    q: "Is this sitemap extractor free?",
    a: "Yes, the tool is completely free with no registration, account or usage limits for normal use.",
  },
  {
    q: "Can it process thousands of URLs?",
    a: "Yes. Large sitemaps are handled with built-in safety caps on sitemap count, URL count and recursion depth so results stay fast, and the results table paginates efficiently.",
  },
  {
    q: "Does an XML sitemap contain every page of a website?",
    a: "Not necessarily. A sitemap lists only the URLs the site owner chose to include. Orphaned pages, blocked pages, or pages simply omitted from the sitemap will not appear in the results.",
  },
  {
    q: "Does this tool show which pages are indexed by Google?",
    a: "No. The tool shows which URLs are listed in the sitemap. Whether Google has indexed them can only be confirmed in Google Search Console's coverage reports.",
  },
  {
    q: "Why is my sitemap not loading?",
    a: "Common causes: an incorrect URL, the server blocking automated requests, an HTTP error (like 404 or 403), or invalid XML. The tool reports the specific issue it encountered \u2014 check the issues panel above the results table.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked Questions"
          description="Quick answers about extracting URLs from XML sitemaps."
        />
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={Math.min(i * 0.04, 0.2)}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition-shadow",
                    isOpen ? "border-brand-200 shadow-card" : "border-gray-200"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-gray-900">{f.q}</span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
                        isOpen ? "rotate-45 bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
                      )}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
