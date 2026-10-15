"use client";

import { BarChart3, CopyX, Download, Layers, Sparkles, Zap } from "lucide-react";
import { Reveal, SectionHeading } from "./ui";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast URL Extraction",
    text: "Fetch and parse sitemaps in seconds with parallel processing and real-time progress updates.",
  },
  {
    icon: Layers,
    title: "Sitemap Index Support",
    text: "Automatically detects sitemap indexes and recursively processes nested child sitemaps at any depth.",
  },
  {
    icon: CopyX,
    title: "Duplicate URL Detection",
    text: "Instantly spot duplicate URL entries, see how often each appears, and in which sitemaps.",
  },
  {
    icon: BarChart3,
    title: "Smart Sitemap Analysis",
    text: "Get URL structure insights: HTTPS coverage, query parameters, trailing slashes, path depth and more.",
  },
  {
    icon: Download,
    title: "CSV and TXT Export",
    text: "Download all, filtered or unique URLs as TXT or spreadsheet-ready CSV with metadata columns.",
  },
  {
    icon: Sparkles,
    title: "Clean and Simple Interface",
    text: "No sign-up, no clutter. Paste a URL, get a clean dashboard — on desktop, tablet or mobile.",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-brand-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Everything You Need to Analyze XML Sitemaps"
          description="A complete toolkit for working with sitemaps — from quick URL lists to deep structural analysis."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-pop">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <f.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
