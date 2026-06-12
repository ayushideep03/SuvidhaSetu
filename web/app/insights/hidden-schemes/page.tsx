import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const GROUPS = [
  {
    key: "sanitation_child",
    emoji: "🧹",
    title: "Children of Sanitation Workers / Safai Karamchari",
    hindiTitle: "सफाई कर्मचारियों के बच्चे",
    desc: "If your parent or guardian works or worked as a manual scavenger or sanitation worker, you may qualify for exclusive scholarships, skill training, and rehabilitation support that won't appear in standard searches.",
    example: "National Safai Karamcharis Finance & Development Corporation (NSKFDC) runs multiple education and livelihood schemes.",
    count: "~23 schemes",
  },
  {
    key: "nomadic_tribe",
    emoji: "🏕️",
    title: "Nomadic & Denotified Tribes (NT / DNT / Vimukta Jati)",
    hindiTitle: "घुमंतू और विमुक्त जनजाति",
    desc: "NT and DNT communities — formerly criminalized under colonial-era laws — have dedicated welfare schemes that are almost entirely invisible on myscheme.gov.in because they require this exact flag to appear.",
    example: "The National Commission for De-notified, Nomadic and Semi-Nomadic Tribes administers several rehabilitation schemes.",
    count: "~18 schemes",
  },
  {
    key: "prisoner_family",
    emoji: "🔒",
    title: "Families of Imprisoned Persons",
    hindiTitle: "कैदियों के परिवार",
    desc: "If a family member is incarcerated, you and your children may qualify for education support, livelihood assistance, and child welfare schemes that specifically address the social vulnerability of prisoner families.",
    example: "Several state prison welfare boards run scholarship programs for children of prisoners.",
    count: "~9 schemes",
  },
  {
    key: "acid_victim",
    emoji: "⚗️",
    title: "Acid Attack Survivors",
    hindiTitle: "एसिड हमले से बचे लोग",
    desc: "Acid attack survivors face permanent disfigurement and social exclusion. Dedicated schemes provide medical rehabilitation, legal aid, skill training, and financial compensation — none of which appear without this specific flag.",
    example: "Ministry of Women & Child Development schemes for acid attack victims include ₹3 Lakh compensation and free medical treatment.",
    count: "~7 schemes",
  },
  {
    key: "hiv_affected",
    emoji: "🎗️",
    title: "People Living with HIV / AIDS",
    hindiTitle: "एचआईवी / एड्स प्रभावित",
    desc: "PLHIV (People Living with HIV) and their families — including orphans of AIDS patients — qualify for dedicated healthcare, antiretroviral support, livelihood, and educational schemes that are deliberately separated from general welfare to protect privacy.",
    example: "NACO and state AIDS control societies run education and livelihood schemes for PLHIV families.",
    count: "~12 schemes",
  },
  {
    key: "cancer",
    emoji: "🩺",
    title: "Cancer Patients & Survivors",
    hindiTitle: "कैंसर रोगी",
    desc: "Cancer diagnosis often brings catastrophic financial burden. Dedicated schemes provide treatment subsidies, free medicines, financial assistance, and palliative care support that are impossible to find through general health scheme searches.",
    example: "The Rashtriya Arogya Nidhi (RAN) provides one-time financial assistance for cancer patients below the poverty line.",
    count: "~11 schemes",
  },
  {
    key: "weaver",
    emoji: "🧵",
    title: "Handloom Weavers & Khadi Artisans",
    hindiTitle: "बुनकर और खादी कारीगर",
    desc: "India's textile artisans — from Banarasi silk weavers to Kashmiri pashmina craftspeople — have an entire ecosystem of dedicated schemes: insurance, credit, design support, market linkage, and health coverage through NHWC and KVIC.",
    example: "The Handloom Weavers Comprehensive Welfare Scheme provides health insurance, thrift fund, and mahawar corpus to 43 lakh weavers.",
    count: "~14 schemes",
  },
  {
    key: "street_vendor",
    emoji: "🛒",
    title: "Street Vendors & Hawkers",
    hindiTitle: "पटरी विक्रेता और फेरीवाले",
    desc: "India's 10 million+ street vendors gained formal recognition under the Street Vendors Act (2014) and the PM SVANidhi scheme. Several follow-on schemes for credit, digital payments, and formalization exist — but only appear when this status is flagged.",
    example: "PM SVANidhi provides working capital loans (₹10,000 → ₹20,000 → ₹50,000) with credit history building and digital incentives.",
    count: "~12 schemes",
  },
];

export default function HiddenSchemesPage() {
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
        <p className="text-xs font-semibold text-saffron uppercase tracking-widest mb-2">Hidden Gems</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-3 leading-tight">
          The 86+ Schemes Standard Portals Miss
        </h1>
        <p
          className="text-lg text-neutral-500 mb-4"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          वो 86+ योजनाएँ जो आम खोज में नहीं मिलतीं
        </p>
        <p className="text-neutral-600 leading-relaxed">
          India's welfare architecture includes schemes for highly specific groups — acid attack survivors,
          nomadic tribes, weavers, street vendors. These schemes exist and are funded, but they're invisible
          on myscheme.gov.in because standard searches return 500–3,000 results without the precision filtering
          to surface them.
        </p>
        <p className="text-neutral-600 leading-relaxed mt-3">
          Suvidha Setu parses 8 hyper-specific eligibility flags. If you or your family belong to any of
          these groups, <strong>the schemes below were built for you</strong>.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { value: "86+", label: "Hidden schemes" },
          { value: "8", label: "Target groups" },
          { value: "0", label: "Standard portal results for these groups" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-ashoka-blue rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-saffron">{value}</p>
            <p className="text-xs text-blue-200 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {GROUPS.map(({ key, emoji, title, hindiTitle, desc, example, count }) => (
          <div key={key} className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-start gap-4 mb-3">
              <span className="text-3xl shrink-0">{emoji}</span>
              <div>
                <h2 className="font-bold text-neutral-900 text-lg leading-snug">{title}</h2>
                <p
                  className="text-sm text-neutral-400"
                  style={{ fontFamily: "var(--font-devanagari), serif" }}
                >
                  {hindiTitle}
                </p>
              </div>
              <span className="ml-auto text-xs bg-saffron-light text-saffron-dark px-2.5 py-1 rounded-full font-semibold shrink-0">
                {count}
              </span>
            </div>
            <p className="text-neutral-600 leading-relaxed mb-3">{desc}</p>
            <div className="bg-india-green-light border border-india-green/20 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-india-green mb-1">Example scheme:</p>
              <p className="text-sm text-india-green/80">{example}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 bg-saffron-light border border-saffron/30 rounded-2xl p-8 text-center">
        <p className="text-2xl mb-3">🔍</p>
        <p className="text-xl font-bold text-saffron-dark mb-2">
          Do any of these describe you?
        </p>
        <p
          className="text-neutral-600 text-sm mb-6"
          style={{ fontFamily: "var(--font-devanagari), serif" }}
        >
          अगर हाँ, तो ये योजनाएँ आपके लिए बनी हैं।
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-bold px-7 py-3 rounded-full transition-colors"
        >
          Find Hidden Schemes →
        </Link>
        <p className="text-xs text-neutral-500 mt-3">
          The questionnaire includes specific questions that unlock these schemes.
        </p>
      </div>
    </div>
  );
}
