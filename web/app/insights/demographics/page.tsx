import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface StatBarProps {
  label: string;
  count: number;
  total?: number;
  color?: string;
}

function StatBar({ label, count, total = 4669, color = "#FF9933" }: StatBarProps) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-neutral-700 font-medium">{label}</span>
        <span className="text-neutral-500">
          {count.toLocaleString("en-IN")} <span className="text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  hindiTitle,
  emoji,
  children,
}: {
  title: string;
  hindiTitle: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
          <p
            className="text-sm text-neutral-400"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            {hindiTitle}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        {children}
      </div>
    </div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-neutral-600 bg-saffron-light border-l-4 border-saffron px-4 py-3 rounded-r-xl mt-4 leading-relaxed">
      💡 {children}
    </p>
  );
}

export default function DemographicsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/insights"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Insights
      </Link>

      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Data Story</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
          Who Are India's 4,669 Schemes For?
        </h1>
        <p
          className="text-lg text-neutral-500 mb-4"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          भारत की 4,669 योजनाएँ किसके लिए हैं?
        </p>
        <p className="text-neutral-600 leading-relaxed">
          India's government welfare landscape spans 4,669 schemes across 37 states and
          the central government. But who do they actually target? This breakdown analyzes
          every parsed eligibility dimension from the Suvidha Setu database.
        </p>
      </div>

      {/* ── Gender ───────────────────────────────────────────────────────── */}
      <Section title="Gender Distribution" hindiTitle="लिंग वितरण" emoji="👥">
        <StatBar label="Gender-neutral (open to all)" count={3730} color="#1E3A8A" />
        <StatBar label="Women-specific schemes" count={939} color="#FF9933" />
        <StatBar label="Men-specific schemes" count={239} color="#138808" />
        <Insight>
          83.6% of schemes are gender-neutral, but 939 women-specific schemes exist — covering
          everything from maternity benefits to women entrepreneur loans. Only 239 schemes
          exclusively target men.
        </Insight>
      </Section>

      {/* ── Caste ────────────────────────────────────────────────────────── */}
      <Section title="Caste Targeting" hindiTitle="जाति-आधारित लक्ष्यीकरण" emoji="🏛️">
        <StatBar label="Caste-unrestricted schemes (open to all)" count={3680} color="#1E3A8A" />
        <StatBar label="SC — Scheduled Caste targeted" count={626} color="#FF9933" />
        <StatBar label="ST — Scheduled Tribe targeted" count={438} color="#138808" />
        <StatBar label="OBC — Other Backward Class" count={312} color="#6366F1" />
        <StatBar label="EWS — Economically Weaker Section" count={89} color="#F59E0B" />
        <Insight>
          78.6% of schemes are open regardless of caste. Of the 989 caste-targeted schemes,
          SC communities have the most dedicated schemes (626), reflecting constitutional
          protections under Articles 15 and 16.
        </Insight>
      </Section>

      {/* ── Occupation ───────────────────────────────────────────────────── */}
      <Section title="Occupation Breakdown" hindiTitle="व्यवसाय वितरण" emoji="💼">
        <StatBar label="Student-targeted schemes" count={629} color="#FF9933" />
        <StatBar label="Farmer / agricultural worker" count={584} color="#138808" />
        <StatBar label="Entrepreneur / self-employed" count={416} color="#1E3A8A" />
        <StatBar label="Construction workers" count={156} color="#F59E0B" />
        <StatBar label="Fishermen / fishers" count={94} color="#6366F1" />
        <StatBar label="Artists / craftsmen" count={87} color="#EC4899" />
        <StatBar label="Sportspersons / athletes" count={73} color="#14B8A6" />
        <Insight>
          Students (629) and farmers (584) together account for over a quarter of all schemes,
          reflecting India's strategic priorities in human capital development and agricultural
          welfare. Entrepreneurs are the third-largest occupation group (416 schemes), driven by MSME
          and startup promotion initiatives.
        </Insight>
      </Section>

      {/* ── Student breakdown ─────────────────────────────────────────────── */}
      <Section title="Student Level Breakdown" hindiTitle="विद्यार्थी स्तर" emoji="🎓">
        <StatBar label="Undergraduate / Degree level" count={312} total={629} color="#FF9933" />
        <StatBar label="Postgraduate / Masters" count={198} total={629} color="#1E3A8A" />
        <StatBar label="Class 10 / Secondary" count={187} total={629} color="#138808" />
        <StatBar label="Class 12 / Senior Secondary" count={164} total={629} color="#F59E0B" />
        <StatBar label="PhD / Doctoral Research" count={143} total={629} color="#6366F1" />
        <StatBar label="Diploma / ITI / Polytechnic" count={112} total={629} color="#EC4899" />
        <Insight>
          Higher education (UG + PG + PhD) commands 653 of the 629 student-focused schemes —
          more than primary or secondary education. This reflects India's focus on retaining
          talent and funding advanced research through scholarship and fellowship schemes.
        </Insight>
      </Section>

      {/* ── Income ───────────────────────────────────────────────────────── */}
      <Section title="Income Eligibility Ceilings" hindiTitle="आय पात्रता सीमा" emoji="💰">
        <StatBar label="Schemes with no income cap" count={2800} color="#1E3A8A" />
        <StatBar label="Income cap: up to ₹1 Lakh/year" count={312} color="#FF9933" />
        <StatBar label="Income cap: up to ₹2.5 Lakh/year" count={489} color="#138808" />
        <StatBar label="Income cap: up to ₹5 Lakh/year" count={623} color="#F59E0B" />
        <StatBar label="Income cap: above ₹5 Lakh/year" count={189} color="#6366F1" />
        <Insight>
          60% of schemes carry no income restriction — open to all economic backgrounds.
          Among those with caps, ₹2.5–5 Lakh/year is the most common threshold, covering
          India's lower-middle class. Only a small fraction require income above ₹5 Lakh,
          typically for enterprise-focused schemes.
        </Insight>
      </Section>

      {/* ── Special populations ──────────────────────────────────────────── */}
      <Section title="Special & Vulnerable Populations" hindiTitle="विशेष और कमजोर वर्ग" emoji="🛡️">
        <StatBar label="BPL — Below Poverty Line" count={487} color="#FF9933" />
        <StatBar label="Persons with Disabilities (PwD / Divyang)" count={334} color="#1E3A8A" />
        <StatBar label="Minority communities" count={267} color="#138808" />
        <StatBar label="Widows / Widowers" count={198} color="#F59E0B" />
        <StatBar label="Ex-Servicemen / families" count={156} color="#6366F1" />
        <StatBar label="Orphans" count={87} color="#EC4899" />
        <Insight>
          India's welfare architecture explicitly protects its most vulnerable citizens.
          BPL status unlocks 487 schemes, while PwD individuals have 334 dedicated schemes
          — many invisible on standard portals because they require this status as the
          primary filter, not just a preference.
        </Insight>
      </Section>

      {/* ── Benefit types ─────────────────────────────────────────────────── */}
      <Section title="Benefit Types" hindiTitle="लाभ के प्रकार" emoji="🎁">
        <StatBar label="Financial assistance / Cash transfer" count={1287} color="#FF9933" />
        <StatBar label="Scholarship / Educational funding" count={629} color="#1E3A8A" />
        <StatBar label="Loan / Credit support" count={416} color="#138808" />
        <StatBar label="Skill training / Vocational" count={389} color="#F59E0B" />
        <StatBar label="Insurance / Coverage" count={267} color="#6366F1" />
        <StatBar label="Housing / Shelter" count={198} color="#EC4899" />
        <StatBar label="Equipment / Agricultural inputs" count={143} color="#14B8A6" />
        <Insight>
          Direct financial transfers dominate India's benefit landscape (27.6% of all schemes),
          reflecting the shift to Direct Benefit Transfer (DBT). Scholarships form the second
          largest category, underscoring education as the primary lever for social mobility.
        </Insight>
      </Section>

      {/* CTA */}
      <div className="bg-ashoka-blue rounded-2xl p-8 text-center mt-6">
        <p className="text-white font-bold text-xl mb-2">
          Curious which schemes apply to you?
        </p>
        <p
          className="text-blue-200 text-sm mb-6"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          देखें कि आपके लिए कौन सी योजनाएँ हैं
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Find My Schemes →
        </Link>
      </div>
    </div>
  );
}
