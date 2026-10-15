import { Network } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <a href="#home" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Network className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[17px] font-bold tracking-tight text-gray-900">
                Sitemap URL Extractor
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              A free online tool to extract, analyze and export URLs from XML
              sitemaps — built for website owners and SEO professionals.
            </p>
          </div>
          <nav aria-label="Product">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-gray-500 transition-colors hover:text-brand-700">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-gray-500 transition-colors hover:text-brand-700">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Sitemap URL Extractor. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Free forever. No sign-up required.</p>
        </div>
      </div>
    </footer>
  );
}
