"use client";

import { ClipboardPaste, Download, ScanSearch } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

const STEPS = [
  {
    icon: ClipboardPaste,
    num: "1",
    title: "Enter Sitemap URL",
    text: "Paste your XML sitemap URL into the input field — or just enter a domain and we'll find the sitemap for you.",
  },
  {
    icon: ScanSearch,
    num: "2",
    title: "Extract and Analyze",
    text: "The tool fetches the sitemap, follows nested indexes, detects duplicates and processes the available URLs.",
  },
  {
    icon: Download,
    num: "3",
    title: "Copy or Download",
    text: "Review results in the interactive dashboard and export the extracted URLs as TXT or CSV.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Extract Sitemap URLs in 3 Simple Steps"
        />
        <div className="relative grid gap-5 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-brand-200 md:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.1}>
              <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-card">
                <span className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 rounded-3xl bg-brand-50" aria-hidden="true" />
                  <s.icon className="relative h-9 w-9 text-brand-600" aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-pop"
                  >
                    {s.num}
                  </span>
                </span>
                <h3 className="mt-5 text-base font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
