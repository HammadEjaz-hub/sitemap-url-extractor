import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the free Sitemap URL Extractor online tool.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-gray-500">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-3 text-sm text-gray-400">Last updated: October 2026</p>

        <Section title="The service">
          <p>
            Sitemap URL Extractor is a free online tool that fetches publicly accessible XML
            sitemaps, extracts the URLs they contain, and presents analysis and export
            options. No registration is required.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="list-disc space-y-2 pl-5">
            <li>Submit only sitemap URLs you are entitled to access (public sitemaps).</li>
            <li>Do not attempt to abuse the service: automated bulk requests may be rate-limited.</li>
            <li>
              Do not use the tool to probe non-public or internal network resources; such
              targets are blocked by design.
            </li>
          </ul>
        </Section>

        <Section title="Accuracy">
          <p>
            Results reflect the contents of the sitemap at the time it was fetched. Sitemaps
            may be incomplete, outdated, or may not list every page of a website. Last-modified
            dates come from the sitemap itself and are not independently verified. Index
            status in search engines is not determined by this tool.
          </p>
        </Section>

        <Section title="Availability and liability">
          <p>
            The tool is provided &ldquo;as is&rdquo;, without warranties of any kind. We do not
            guarantee uninterrupted availability. To the maximum extent permitted by law, we
            are not liable for any loss arising from the use of this tool or reliance on its
            results.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            These terms may be updated from time to time; continued use of the tool after
            changes constitutes acceptance of the updated terms.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
