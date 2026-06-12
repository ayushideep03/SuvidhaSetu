import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STORIES = [
  {
    href: "/insights/demographics",
    emoji: "📊",
    title: "Who Are India's Schemes For?",
    hindiTitle: "भारत की योजनाएँ किसके लिए हैं?",
    desc: "A data-driven breakdown across caste, gender, occupation, age, income, and special populations. See where the welfare state actually focuses.",
    readTime: "8 min read",
    highlight: "939 women-specific · 626 SC-targeted · 584 for farmers",
  },
  {
    href: "/insights/how-it-works",
    emoji: "⚙️",
    title: "How the Engine Works",
    hindiTitle: "इंजन कैसे काम करता है?",
    desc: "The architecture behind Suvidha Setu: how 4,669 scheme descriptions become 70+ eligibility flags, and how 13 hard filters become a 0–100 score.",
    readTime: "6 min read",
    highlight: "13 hard filters · 70+ flags · 0–100 score",
  },
  {
    href: "/insights/hidden-schemes",
    emoji: "🔍",
    title: "Hidden Schemes That Standard Portals Miss",
    hindiTitle: "छुपी हुई योजनाएँ",
    desc: "86+ schemes invisible to standard portal searches — targeting sanitation workers' children, acid attack survivors, nomadic tribes, weavers & more.",
    readTime: "5 min read",
    highlight: "86+ invisible schemes · 8 hyper-specific groups",
  },
  {
    href: "/insights/launch-notes",
    emoji: "✅",
    title: "Launch Notes and Recent Changes",
    hindiTitle: "लॉन्च अपडेट",
    desc: "A concise record of the production-readiness fixes: Vercel deployment, privacy, translation, search, scoring labels, visit counter, and smoother UI transitions.",
    readTime: "3 min read",
    highlight: "Search · privacy · translations · animations",
  },
];

export default function InsightsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">
          Data Stories
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3">
          Insights from India's Welfare State
        </h1>
        <p
          className="text-lg text-neutral-500"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          भारत की कल्याणकारी योजनाओं की जानकारी
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {STORIES.map(({ href, emoji, title, hindiTitle, desc, readTime, highlight }) => (
          <Link
            key={href}
            href={href}
            className="group block bg-white rounded-2xl border border-neutral-200 p-7 hover:border-saffron/40 hover:shadow-card-hover transition-all duration-200"
          >
            <div className="flex items-start gap-5">
              <span className="text-4xl shrink-0">{emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 group-hover:text-saffron transition-colors mb-1">
                      {title}
                    </h2>
                    <p
                      className="text-sm text-neutral-400 mb-3"
                      style={{ fontFamily: "var(--font-devanagari), serif" }}
                    >
                      {hindiTitle}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0 mt-1">{readTime}</span>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-saffron-light text-saffron-dark px-3 py-1 rounded-full font-medium">
                    {highlight}
                  </span>
                  <span className="text-sm font-semibold text-saffron flex items-center gap-1">
                    Read <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
