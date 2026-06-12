import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

const UPDATES = [
  {
    title: "Public Vercel deployment",
    body: "The app now runs as two Vercel projects: a Next.js frontend and a FastAPI backend with the read-only SQLite scheme database bundled for launch.",
  },
  {
    title: "Privacy-first questionnaire",
    body: "Sensitive answers are used for matching, are not persisted in browser storage, and are not saved by the app on the server.",
  },
  {
    title: "Search and browsing",
    body: "Browse now supports direct scheme search by name, ministry, state, category, description, tags, and slug. Results also include search within matched schemes.",
  },
  {
    title: "Eligibility scoring cleanup",
    body: "The Eligible threshold is now 55+, low-score results are labelled more honestly as Not Excluded - Verify, and field-specific hard filters were tightened so technical-only schemes do not rank highly for unrelated courses.",
  },
  {
    title: "Safer UI language and icons",
    body: "Sensitive profile choices were cleaned up to avoid careless emoji use for serious lived experiences.",
  },
  {
    title: "Translations",
    body: "The site includes English plus 12 Indian language options through Google Translate for page chrome and scheme text.",
  },
  {
    title: "Content rendering fixes",
    body: "Scheme descriptions and How to Apply sections now clean markdown headers, HTML breaks, literal line-break artifacts, and inconsistent formatting.",
  },
  {
    title: "More deliberate experience",
    body: "Question transitions, result-card reveals, and hover states were added so the app feels smoother and less rushed.",
  },
  {
    title: "Global visit counter",
    body: "The public visit count now uses Upstash Redis so it increments globally instead of being tied to one device.",
  },
  {
    title: "Open-source readiness",
    body: "The repository now includes contribution guidance, security reporting notes, an MIT license, and public website guidance for contributors.",
  },
  {
    title: "Basic abuse protection",
    body: "Frontend API routes and backend endpoints now include request-size limits and per-IP throttling to reduce easy abuse. Large distributed attacks still require platform-level protection.",
  },
];

export default function LaunchNotesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to insights
      </Link>

      <div className="mb-10">
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">
          Launch Notes
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          What Changed Before Launch
        </h1>
        <p className="text-lg text-neutral-500 leading-relaxed">
          A concise record of the production-readiness fixes, UX polish, and documentation updates added before public deployment.
        </p>
      </div>

      <div className="grid gap-4">
        {UPDATES.map(({ title, body }) => (
          <section
            key={title}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-india-green/40 hover:shadow-card"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-india-green" />
              <div>
                <h2 className="font-bold text-neutral-900 mb-1">{title}</h2>
                <p className="text-sm leading-relaxed text-neutral-600">{body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-ashoka-blue/15 bg-ashoka-blue-light px-5 py-4">
        <h2 className="font-bold text-neutral-900 mb-2">Documentation Locations</h2>
        <div className="flex flex-col gap-2 text-sm text-neutral-600">
          <Link href="/insights/how-it-works" className="inline-flex items-center gap-1.5 hover:text-ashoka-blue">
            Engine explanation
            <ExternalLink size={13} />
          </Link>
          <Link href="/insights/demographics" className="inline-flex items-center gap-1.5 hover:text-ashoka-blue">
            Demographic data report
            <ExternalLink size={13} />
          </Link>
          <Link href="/insights/hidden-schemes" className="inline-flex items-center gap-1.5 hover:text-ashoka-blue">
            Hidden schemes overview
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
