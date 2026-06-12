import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const HARD_FILTERS = [
  { n: 1, title: "Institution-only check", desc: "Schemes targeting only hospitals, universities, or NGOs are excluded for individual applicants." },
  { n: 2, title: "State lock", desc: "If a scheme is only for residents of Maharashtra, a Bihar resident is excluded — even if all other criteria match." },
  { n: 3, title: "Gender restriction", desc: "Women-only schemes exclude male applicants. Men-only schemes exclude female applicants." },
  { n: 4, title: "Age bounds violation", desc: "Schemes with minimum or maximum age requirements exclude applicants outside those bounds." },
  { n: 5, title: "Caste restriction", desc: "SC-only schemes exclude non-SC applicants. OBC schemes exclude General category applicants." },
  { n: 6, title: "Occupation mismatch", desc: "Schemes targeting farmers exclude students. Student scholarships exclude farmers." },
  { n: 7, title: "Special status requirement", desc: "Widow-only schemes exclude non-widows. BPL-only schemes exclude non-BPL applicants." },
  { n: 8, title: "Hyper-specific circumstance", desc: "Schemes for acid attack survivors, HIV-affected families, or street vendors exclude general applicants." },
  { n: 9, title: "Student level bounds", desc: "A PhD fellowship scheme excludes Class 10 students. A primary school scheme excludes postgraduates." },
  { n: 10, title: "Field of study mismatch", desc: "An engineering-only scholarship excludes arts students. A medical fellowship excludes computer science students." },
  { n: 11, title: "Merit / achievement requirement", desc: "Olympiad-winner grants exclude non-participants. Board-topper awards exclude average scorers." },
  { n: 12, title: "Income cap exceeded", desc: "If a scheme's income cap is ₹2.5 Lakh/year and you earn ₹5 Lakh/year, you're excluded." },
  { n: 13, title: "Marks below minimum", desc: "Many scholarships require 60%+ or 75%+. Applicants below the threshold are excluded." },
];

const SOFT_WEIGHTS = [
  { label: "Occupation match", weight: 25, desc: "Scheme specifically targets your occupation (student, farmer, entrepreneur, etc.)" },
  { label: "Geographic match", weight: 15, desc: "Scheme is state-specific AND matches your state" },
  { label: "Caste specificity", weight: 10, desc: "Scheme is caste-targeted AND you belong to that caste" },
  { label: "Student level match", weight: 10, desc: "Exact education level match (UG scheme for a UG student)" },
  { label: "Benefit preference overlap", weight: 10, desc: "Scheme offers benefits you said you're interested in" },
  { label: "Income eligibility", weight: 8, desc: "Your income is within the scheme's cap" },
  { label: "Sector preference", weight: 7, desc: "Scheme category matches your stated sector interests" },
  { label: "Gender-specific match", weight: 5, desc: "Women-targeted scheme for a female applicant" },
  { label: "Special status bonus", weight: 5, desc: "Scheme explicitly targets your special status (BPL, disabled, etc.)" },
  { label: "Engineering branch match", weight: 5, desc: "Scheme targets your specific engineering branch" },
  { label: "Achievement bonus", weight: 5, desc: "Scheme rewards your specific achievement (Olympiad, board topper)" },
  { label: "Farmer land size match", weight: 5, desc: "Marginal farmer scheme matches a marginal farmer applicant" },
];

export default function HowItWorksPage() {
  const totalWeight = SOFT_WEIGHTS.reduce((s, w) => s + w.weight, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Insights
      </Link>

      <div className="mb-10">
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Technical Story</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
          How the Matching Engine Works
        </h1>
        <p
          className="text-lg text-neutral-500 mb-4"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          इंजन कैसे काम करता है?
        </p>
        <p className="text-neutral-600 leading-relaxed">
          Suvidha Setu doesn't use AI or machine learning. It uses a deterministic, auditable
          pipeline: parse free-text eligibility descriptions into structured flags, apply 13 hard
          exclusion filters, then rank survivors on a 0–100 scale. Here's every step.
        </p>
      </div>

      {/* ── Phase 1: Parsing ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-saffron text-white font-bold text-sm flex items-center justify-center">1</span>
          <h2 className="text-xl font-bold text-neutral-900">Eligibility Parsing</h2>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <p className="text-neutral-600 leading-relaxed mb-4">
            Each of the 4,669 schemes has a free-text eligibility description like:
            <em className="text-neutral-800"> "SC/ST/OBC students from West Bengal who have scored 75%+ in Class 12 and belong to BPL families."</em>
          </p>
          <p className="text-neutral-600 leading-relaxed mb-4">
            A one-time preprocessing step (<code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">parse_eligibility.py</code>)
            runs over 13 regex-driven parsing sections to convert this into 70+ boolean and numeric columns:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "caste_sc ✓", "caste_st ✓", "caste_obc ✓", "state_locked = West Bengal",
              "occ_student ✓", "student_class12 ✓", "marks_min = 75",
              "req_bpl ✓", "age_min / age_max", "gender_female / gender_male",
              "for_individual ✓", "income_max",
            ].map((flag) => (
              <span key={flag} className="text-xs bg-saffron-light text-saffron-dark px-2 py-1 rounded font-mono">
                {flag}
              </span>
            ))}
          </div>
          <p className="text-sm text-neutral-500 mt-4">
            This runs once — at scrape time — and is stored in the <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">parsed_eligibility</code> SQLite table.
            All 4,669 schemes are pre-parsed; no parsing happens at query time.
          </p>
        </div>
      </section>

      {/* ── Phase 2: Hard filters ────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-ashoka-blue text-white font-bold text-sm flex items-center justify-center">2</span>
          <h2 className="text-xl font-bold text-neutral-900">13 Hard Exclusion Filters</h2>
        </div>
        <p className="text-neutral-600 mb-4">
          Applied in order. If a scheme fails any filter, its score becomes <strong>-1</strong> and it's removed
          from results entirely. No soft scoring runs for excluded schemes.
        </p>
        <div className="space-y-2">
          {HARD_FILTERS.map(({ n, title, desc }) => (
            <div key={n} className="bg-white rounded-xl border border-neutral-200 p-4 flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {n}
              </span>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">{title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mt-4 bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <strong>Important exception rule:</strong> Filters 7 and 8 (special status, hyper-specific circumstances)
          are skipped when the scheme is caste-restricted. Reason: in caste-restricted schemes, "BPL" or
          "widow" appear as co-listed categories, not exclusive targeting criteria. The caste check (filter 5)
          already determined eligibility.
        </p>
      </section>

      {/* ── Phase 3: Soft scoring ────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-full bg-india-green text-white font-bold text-sm flex items-center justify-center">3</span>
          <h2 className="text-xl font-bold text-neutral-900">0–100 Soft Scoring</h2>
        </div>
        <p className="text-neutral-600 mb-4">
          Schemes that survive the hard filters are ranked by relevance. Points are awarded for
          how well the scheme matches your profile — higher = more relevant to you specifically.
        </p>
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-3 bg-neutral-50 text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 py-3 border-b border-neutral-100">
            <span>Scoring dimension</span>
            <span className="text-center">Weight</span>
            <span>When awarded</span>
          </div>
          {SOFT_WEIGHTS.map(({ label, weight, desc }) => (
            <div key={label} className="grid grid-cols-3 px-4 py-3 gap-3 items-start border-t border-neutral-100 text-sm">
              <span className="font-medium text-neutral-800">{label}</span>
              <div className="text-center">
                <span className="font-bold text-saffron">{weight}</span>
                <span className="text-neutral-400 text-xs"> pts</span>
                <div className="h-1.5 bg-neutral-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-saffron rounded-full" style={{ width: `${(weight / totalWeight) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-neutral-500 leading-relaxed">{desc}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 px-4 py-3 border-t-2 border-neutral-200 bg-neutral-50 text-sm">
            <span className="font-bold text-neutral-800">Total</span>
            <span className="text-center font-bold text-saffron">{totalWeight} pts max</span>
            <span className="text-xs text-neutral-400">→ normalized to 0–100</span>
          </div>
        </div>
      </section>

      {/* ── Score thresholds ──────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Score Thresholds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "✅", label: "Eligible", hindiLabel: "पात्र", range: "55–100", color: "bg-india-green-light border-india-green text-india-green" },
            { icon: "⚠️", label: "Likely Eligible", hindiLabel: "संभवतः पात्र", range: "25–54", color: "bg-yellow-50 border-yellow-300 text-yellow-700" },
            { icon: "ℹ️", label: "Not Excluded — Verify", hindiLabel: "बाहर नहीं किया गया — जाँचें", range: "0–24", color: "bg-ashoka-blue-light border-ashoka-blue text-ashoka-blue" },
          ].map(({ icon, label, hindiLabel, range, color }) => (
            <div key={label} className={`border rounded-xl p-4 ${color}`}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className="font-bold">{label}</p>
              <p className="text-xs mb-1" style={{ fontFamily: "var(--font-devanagari), serif" }}>{hindiLabel}</p>
              <p className="text-xs font-mono">Score: {range}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-saffron rounded-2xl p-8 text-center">
        <p className="text-white font-bold text-xl mb-2">See it in action</p>
        <p className="text-white/80 text-sm mb-6">
          Run the questionnaire and watch the engine rank 4,669 schemes for your profile in seconds.
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 bg-white text-saffron-dark font-bold px-6 py-3 rounded-full hover:bg-saffron-light transition-colors"
        >
          Find My Schemes →
        </Link>
      </div>
    </div>
  );
}
