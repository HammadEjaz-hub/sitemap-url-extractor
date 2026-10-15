"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ExtractorTool from "./ExtractorTool";

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 sm:pt-32">
      {/* soft decorative glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="animate-float-slow absolute right-[8%] top-40 hidden h-56 w-56 rounded-full bg-brand-200/40 blur-3xl lg:block" />
        <div className="animate-float-slow absolute left-[6%] top-72 hidden h-40 w-40 rounded-full bg-brand-100/70 blur-2xl lg:block" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Free Online SEO Tool
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Extract <span className="text-brand-600">Every URL</span> From Your
            XML Sitemap
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg"
          >
            Extract, analyze, organize, and download URLs from XML sitemaps in
            seconds. A powerful and easy-to-use SEO tool built for website
            owners and SEO professionals.
          </motion.p>
        </div>

        <motion.div
          id="tool"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24 }}
          className="relative mx-auto mt-10 max-w-4xl scroll-mt-24 pb-4"
        >
          {/* purple glow behind the tool card */}
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-200/50 via-brand-100/40 to-transparent blur-2xl"
          />
          <div className="relative">
            <ExtractorTool />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
