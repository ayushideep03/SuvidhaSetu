import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, Sparkles, Users, Filter, HeartHandshake } from "lucide-react";
import { VisitorCounter } from "@/components/ui/VisitorCounter";
import { AshokaChakra } from "@/components/ui/AshokaChakra";

const STATS = [
  { value: "4,669", label: "Government Schemes", hindiLabel: "सरकारी योजनाएँ" },
  { value: "37", label: "States & UTs", hindiLabel: "राज्य और केंद्र शासित प्रदेश" },
  { value: "70+", label: "Eligibility Criteria", hindiLabel: "पात्रता मानदंड" },
  { value: "20–50", label: "Ranked Results", hindiLabel: "रैंक किए गए परिणाम" },
];

const COMPARISON = [
  {
    feature: "Results per query",
    them: "500–3,000 unfiltered",
    us: "20–50 ranked by relevance",
  },
  {
    feature: "Personalization",
    them: "None — same results for everyone",
    us: "Tailored to your age, state, caste, income & occupation",
  },
  {
    feature: "Hyper-specific schemes",
    them: "Invisible in standard searches",
    us: "86+ unlocked for acid survivors, weavers, nomadic tribes & more",
  },
  {
    feature: "Eligibility check",
    them: "You must read each scheme manually",
    us: "13 hard filters + ranked score tell you exactly why you qualify",
  },
];

const INSIGHT_TEASERS = [
  {
    href: "/insights/demographics",
    emoji: "📊",
    title: "Who Are India's Schemes For?",
    hindiTitle: "भारत की योजनाएँ किसके लिए हैं?",
    desc: "A data-driven breakdown: 939 women-specific, 626 SC-targeted, 584 for farmers — see the full picture.",
  },
  {
    href: "/insights/how-it-works",
    emoji: "⚙️",
    title: "How the Engine Works",
    hindiTitle: "इंजन कैसे काम करता है?",
    desc: "13 hard filters, 70+ parsed flags, and a 0–100 score — the architecture behind precision matching.",
  },
  {
    href: "/insights/hidden-schemes",
    emoji: "🔍",
    title: "Hidden Schemes You Never Knew Existed",
    hindiTitle: "छुपी हुई योजनाएँ",
    desc: "86+ schemes invisible to standard portals — for sanitation workers' children, acid attack survivors & more.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-warm-50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <AshokaChakra className="w-[600px] h-[600px] text-ashoka-blue opacity-[0.03]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-saffron-light text-saffron-dark text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-saffron/30">
            <Sparkles size={12} />
            4,669 schemes · Intelligently ranked
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-ashoka-blue mb-3 leading-tight">
            Suvidha Setu
          </h1>

          <p
            className="text-xl sm:text-2xl font-semibold text-neutral-700 mb-4 tracking-tight"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            सुविधा सेतु
          </p>

          <p
            className="text-base sm:text-lg text-neutral-600 mb-2 max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            4,669 सरकारी योजनाएँ, आपके लिए सही एक।
          </p>
          <p className="text-sm text-neutral-500 mb-10 max-w-xl mx-auto">
            Not 3,000 results. Not a list you have to read manually.
            The right scheme for <em>you</em>, ranked by eligibility.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 w-full sm:w-auto"
            >
              <span style={{ fontFamily: "var(--font-devanagari), serif" }}>सारथी से बात करें</span>
              <span className="text-white/70 mx-1">—</span>
              Talk to Saarthi
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/find"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-saffron text-saffron hover:bg-saffron/5 font-bold text-lg px-8 py-4 rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full sm:w-auto"
            >
              Manual Form Search
            </Link>
          </div>

          <p className="text-xs text-neutral-400 mt-4">Free · No login · ~2 minutes</p>

          <div className="mt-8">
            <VisitorCounter />
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="bg-ashoka-blue text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label, hindiLabel }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-extrabold text-saffron">{value}</p>
                <p className="text-white text-sm font-medium mt-1">{label}</p>
                <p
                  className="text-blue-300 text-xs mt-0.5"
                  style={{ fontFamily: "var(--font-devanagari), serif" }}
                >
                  {hindiLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why this matters ─────────────────────────────────────────────── */}
      <section className="bg-white py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">
                Why This Matters
              </p>
              <h2 className="section-heading mb-4">
                Most people do not know what they are owed.
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                India has thousands of schemes, but the people who need them often never hear about the specific
                ones meant for them. A scholarship may depend on your stream or department. A farming scheme may
                depend on what kind of farmer you are. A business benefit may depend on your MSME size, sector,
                registration, or owner background.
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Suvidha Setu asks those deeper questions so special needs and specific categories are not missed:
                students, farmers, small businesses, sanitation workers&apos; families, acid attack survivors,
                weavers, street vendors, and many more.
              </p>
            </div>

            <div className="rounded-2xl border border-india-green/15 bg-india-green-light/60 p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-india-green shadow-sm">
                <HeartHandshake size={22} />
              </div>
              <h3 className="mb-3 text-lg font-bold text-neutral-900">
                The goal is not just search. It is care.
              </h3>
              <p className="text-sm leading-relaxed text-neutral-700">
                Instead of giving everyone the same huge list, the app narrows 4,669 schemes into a short,
                ranked set that explains why each result may fit your life, needs, and eligibility.
              </p>
              <Link
                href="/insights/hidden-schemes"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-india-green hover:text-saffron"
              >
                See hidden scheme examples
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="section-heading">Three steps to your scheme</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Users, title: "Tell us about yourself", desc: "Answer ~12 quick questions — no dropdowns, just tap the option that fits you." },
              { step: "02", icon: Filter, title: "We filter 4,669 schemes", desc: "13 hard eligibility filters remove schemes you can't apply for. Instantly." },
              { step: "03", icon: Sparkles, title: "Get your ranked list", desc: "20–50 schemes ranked 0–100 by relevance, each with the exact reason you qualify." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="bg-warm-50 rounded-2xl p-6 border border-warm-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl font-black text-warm-200">{step}</span>
                  <div className="w-9 h-9 bg-saffron-light rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-saffron" />
                  </div>
                </div>
                <h3 className="font-bold text-neutral-900 mb-1.5">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/find"
              className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-semibold px-7 py-3 rounded-full transition-colors"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comparison table ──────────────────────────────────────────────── */}
      <section className="py-16 bg-warm-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Why Suvidha Setu?</p>
            <h2 className="section-heading">Different from myscheme.gov.in</h2>
          </div>

          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-card">
            <div className="grid grid-cols-3 bg-neutral-50 text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3 border-b border-neutral-100">
              <span>Feature</span>
              <span className="text-center">myscheme.gov.in</span>
              <span className="text-center text-saffron">Suvidha Setu</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-4 py-4 gap-4 items-start border-t border-neutral-100 ${i % 2 === 1 ? "bg-neutral-50/50" : ""}`}
              >
                <p className="text-sm font-medium text-neutral-800">{row.feature}</p>
                <div className="flex items-start gap-1.5 justify-center">
                  <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-500 text-center">{row.them}</p>
                </div>
                <div className="flex items-start gap-1.5 justify-center">
                  <CheckCircle2 size={15} className="text-india-green shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-700 text-center">{row.us}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insight teasers ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Stories & Data</p>
            <h2 className="section-heading">Insights from 4,669 schemes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {INSIGHT_TEASERS.map(({ href, emoji, title, hindiTitle, desc }) => (
              <Link
                key={href}
                href={href}
                className="group block bg-white rounded-2xl p-6 border border-neutral-200 hover:border-saffron/30 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="text-3xl mb-3 block">{emoji}</span>
                <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-saffron transition-colors">{title}</h3>
                <p
                  className="text-xs text-neutral-400 mb-2"
                  style={{ fontFamily: "var(--font-devanagari), serif" }}
                >
                  {hindiTitle}
                </p>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                <p className="text-xs font-semibold text-saffron mt-4 flex items-center gap-1">
                  Read story <ArrowRight size={12} />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="bg-ashoka-blue py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <p
            className="text-3xl sm:text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            अभी खोजें
          </p>
          <p className="text-blue-200 mb-8 text-lg">
            Find the government scheme you deserve — in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-colors"
            >
              Talk to Saarthi <ArrowRight size={18} />
            </Link>
            <Link
              href="/find"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/50 text-white hover:bg-white/10 font-bold text-lg px-8 py-4 rounded-full transition-colors"
            >
              Manual Form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
