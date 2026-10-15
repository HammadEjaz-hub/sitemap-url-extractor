"use client";

import { useEffect, useState } from "react";
import { Menu, Network, X } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-white/85 backdrop-blur-md transition-shadow",
        scrolled ? "border-gray-200 shadow-[0_4px_20px_-8px_rgba(139,92,246,.25)]" : "border-transparent"
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <a href="#home" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop">
            <Network className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-gray-900">
            Sitemap URL Extractor
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <a
            href="#tool"
            className="inline-flex items-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-pop transition-all hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Try Free Tool
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-brand-50 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#tool"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-600"
          >
            Try Free Tool
          </a>
        </div>
      )}
    </header>
  );
}
