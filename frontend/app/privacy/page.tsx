import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Sitemap URL Extractor: how submitted sitemap URLs are processed, what is stored, and what is not.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-gray-500">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-gray-400">Last updated: October 2026</p>

        <Section title="What this tool does">
          <p>
            Sitemap URL Extractor is a free online utility. You submit a sitemap URL or a
            domain; our backend fetches the public sitemap, parses it, and returns the
            extracted URLs to your browser.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-gray-700">Submitted sitemap URLs:</strong> transmitted to
              our backend solely to perform the extraction you requested. They are processed
              in memory and <strong className="text-gray-700">not permanently stored</strong>.
            </li>
            <li>
              <strong className="text-gray-700">No account data:</strong> the tool requires no
              registration, so we collect no names, emails or passwords.
            </li>
            <li>
              <strong className="text-gray-700">Technical logs:</strong> our hosting providers
              may keep standard server logs (e.g. IP address, request time) for security and
              reliability, as described in their own privacy policies.
            </li>
          </ul>
        </Section>

        <Section title="What we do not do">
          <ul className="list-disc space-y-2 pl-5">
            <li>We do not sell or share your data with advertisers.</li>
            <li>We do not use tracking cookies or cross-site trackers.</li>
            <li>We do not retain extracted URL lists after your request completes.</li>
          </ul>
        </Section>

        <Section title="Third parties">
          <p>
            The site is hosted on standard cloud platforms (frontend and backend hosting).
            Those providers process requests on our behalf under their own privacy policies.
            No analytics provider is embedded in this page beyond what the host collects by
            default.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Because we do not keep accounts or store your submissions, there is nothing to
            export or delete. If you have a privacy question about this tool, you can stop
            using it at any time — no data of yours remains with us.
          </p>
        </Section>
      </main>
      <Footer />
    </>
  );
}
