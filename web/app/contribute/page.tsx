import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, ShieldCheck } from "lucide-react";

const GITHUB_URL = "https://github.com/Ayushideep/SuvidhaSetu";

const CONTRIBUTION_AREAS = [
  "Improve accessibility, layout, and mobile polish.",
  "Report scheme matching issues or unclear eligibility explanations.",
  "Improve documentation, setup notes, and deployment guidance.",
  "Add focused tests for scoring, filtering, API, and frontend flows.",
  "Suggest safer copy for sensitive categories and user-facing guidance.",
];

const SAFETY_RULES = [
  "Do not commit secrets, tokens, local environment files, or scraper sessions.",
  "Do not log or persist sensitive questionnaire answers.",
  "Keep eligibility language honest: results are indicative, not official decisions.",
  "Treat caste, income, disability, health, survivor, widow, and family-status information as sensitive.",
];

export default function ContributePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">
          Open Source
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          Contributions Are Welcome
        </h1>
        <p className="text-lg text-neutral-500 leading-relaxed">
          Suvidha Setu is being prepared as open civic technology. The goal is to make scheme discovery easier,
          safer, and more transparent for everyone.
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-700"
        >
          <Code2 size={16} />
          View on GitHub
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-neutral-900 mb-4">Helpful Contributions</h2>
          <div className="space-y-3">
            {CONTRIBUTION_AREAS.map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm leading-relaxed text-neutral-600">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-india-green" />
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ashoka-blue/15 bg-ashoka-blue-light p-6">
          <h2 className="flex items-center gap-2 font-bold text-neutral-900 mb-4">
            <ShieldCheck size={18} className="text-ashoka-blue" />
            Safety Rules
          </h2>
          <div className="space-y-3">
            {SAFETY_RULES.map((item) => (
              <p key={item} className="text-sm leading-relaxed text-neutral-700">
                {item}
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="font-bold text-neutral-900 mb-2">Before Opening a Pull Request</h2>
        <p className="text-sm leading-relaxed text-neutral-600 mb-4">
          Run the relevant local checks, keep changes scoped, and update documentation when public behavior,
          privacy, deployment, or scoring changes.
        </p>
        <Link
          href="/insights/launch-notes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-saffron hover:text-saffron-dark"
        >
          Read launch notes
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
