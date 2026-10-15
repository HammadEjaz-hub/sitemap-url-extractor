import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "Sitemap URL Extractor – Free Online XML Sitemap Tool";
const DESCRIPTION =
  "Extract URLs from XML sitemaps and sitemap indexes online. Analyze URLs, detect duplicates, and export sitemap links to CSV or TXT for free.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Sitemap URL Extractor",
  },
  description: DESCRIPTION,
  keywords: [
    "sitemap url extractor",
    "xml sitemap url extractor",
    "extract urls from sitemap",
    "sitemap url extractor online",
    "xml sitemap parser",
    "sitemap url list",
    "sitemap url export tool",
    "sitemap url checker",
  ],
  authors: [{ name: "Sitemap URL Extractor" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Sitemap URL Extractor",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sitemap URL Extractor",
  applicationCategory: "SEOApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: DESCRIPTION,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a sitemap URL extractor?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A sitemap URL extractor reads a website's XML sitemap and lists every page URL it contains, so you can audit, analyze or export the full URL inventory without opening raw XML files.",
      },
    },
    {
      "@type": "Question",
      name: "How do I extract URLs from a sitemap?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste the sitemap URL into the extractor above and click Extract Sitemap URLs. The tool fetches the sitemap, parses it, follows any nested sitemap indexes, and shows every URL in an interactive results table.",
      },
    },
    {
      "@type": "Question",
      name: "Can I extract URLs from a sitemap index?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Sitemap index files are detected automatically and every referenced child sitemap is fetched and processed recursively, including nested indexes.",
      },
    },
    {
      "@type": "Question",
      name: "Does this tool support WordPress sitemaps?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. WordPress sitemaps (including the /wp-sitemap.xml index format), Shopify sitemaps, custom XML sitemaps and gzip-compressed (.xml.gz) sitemaps are all supported.",
      },
    },
    {
      "@type": "Question",
      name: "Can I download extracted URLs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Export all or selected URLs as TXT or CSV (with optional metadata columns), or copy them to your clipboard.",
      },
    },
    {
      "@type": "Question",
      name: "Is this sitemap extractor free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the tool is completely free with no registration or account required.",
      },
    },
    {
      "@type": "Question",
      name: "Can it process thousands of URLs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Large sitemaps are processed with built-in caps (sitemap count, URL count and recursion depth) to keep results fast; the results table paginates efficiently.",
      },
    },
    {
      "@type": "Question",
      name: "Does an XML sitemap contain every page of a website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not necessarily. A sitemap lists the URLs the site owner chose to include; orphaned pages, blocked pages or pages simply omitted from the sitemap will not appear.",
      },
    },
    {
      "@type": "Question",
      name: "Does this tool show which pages are indexed by Google?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The tool shows which URLs are listed in the sitemap. Index status can only be confirmed in Google Search Console.",
      },
    },
    {
      "@type": "Question",
      name: "Why is my sitemap not loading?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Common causes are an incorrect URL, the sitemap blocking automated requests, an HTTP error, or invalid XML. The tool reports the specific issue it encountered so you can fix it.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <MotionConfig reducedMotion="user">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
