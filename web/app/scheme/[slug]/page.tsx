import { ArrowLeft, ExternalLink, MapPin, Building2, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getSchemeDetail } from "@/lib/api";
import { cleanText } from "@/lib/text";
import { ExplainButtons } from "@/components/ai/ExplainButtons";
import { DocumentChecklist } from "@/components/scheme/DocumentChecklist";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SchemePage({ params }: Props) {
  const { slug } = await params;

  let scheme;
  try {
    scheme = await getSchemeDetail(slug);
  } catch {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="text-xl font-bold text-neutral-800 mb-2">Scheme not found</h1>
        <p className="text-neutral-500 mb-6">The scheme you're looking for doesn't exist or couldn't be loaded.</p>
        <Link href="/browse" className="text-saffron underline">
          ← Browse all schemes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to results
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-snug mb-3">
              {scheme.scheme_name}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-neutral-500">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {scheme.state ?? "All India"}
              </span>
              {scheme.ministry && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} />
                  {scheme.ministry}
                </span>
              )}
            </div>
          </div>
          {scheme.official_url && (
            <a
              href={scheme.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-ashoka-blue text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-ashoka-blue/90 transition-colors shrink-0"
            >
              Apply Now <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Tags */}
        {scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scheme.tags.map((tag) => (
              <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Explanation Tools */}
      <ExplainButtons scheme={scheme} />

      {/* Benefit highlight */}
      {scheme.monetary_benefit && (
        <div className="bg-saffron-light border border-saffron/30 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="text-3xl">💰</div>
          <div>
            <p className="text-xs font-semibold text-saffron-dark uppercase tracking-wide mb-0.5">
              Primary Benefit
            </p>
            <p className="text-2xl font-bold text-saffron-dark">
              {scheme.monetary_benefit}
            </p>
          </div>
        </div>
      )}

      {/* Description */}
      {scheme.brief_description && (
        <Section title="About this Scheme" hindiTitle="इस योजना के बारे में">
          <TextContent text={scheme.brief_description} />
        </Section>
      )}

      {/* Eligibility */}
      {scheme.eligibility_md && (
        <Section title="Eligibility Criteria" hindiTitle="पात्रता मानदंड">
          <MarkdownContent md={scheme.eligibility_md} />
        </Section>
      )}

      {/* Benefits */}
      {scheme.benefits_md && (
        <Section title="Benefits" hindiTitle="लाभ">
          <MarkdownContent md={scheme.benefits_md} />
        </Section>
      )}

      {/* Documents */}
      <DocumentChecklist schemeName={scheme.scheme_name} documentsMd={scheme.documents_required_md} />

      {/* Application process */}
      {scheme.application_process && scheme.application_process.length > 0 && (
        <Section title="How to Apply" hindiTitle="आवेदन कैसे करें" icon={CheckCircle2}>
          <ol className="space-y-3">
            {scheme.application_process.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-saffron-light text-saffron-dark text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {typeof step === "string" ? step : (step as { description?: string }).description ?? JSON.stringify(step)}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Exclusions */}
      {scheme.exclusions_md && (
        <Section title="Exclusions" hindiTitle="अपवाद">
          <MarkdownContent md={scheme.exclusions_md} />
        </Section>
      )}

      {/* Apply CTA */}
      {scheme.official_url && (
        <div className="mt-8 bg-ashoka-blue rounded-2xl p-6 text-center">
          <p className="text-white font-bold text-lg mb-1">Ready to apply?</p>
          <p
            className="text-blue-200 text-sm mb-4"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            आवेदन करने के लिए तैयार हैं?
          </p>
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Apply on Official Portal <ExternalLink size={15} />
          </a>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  hindiTitle,
  icon: Icon,
  children,
}: {
  title: string;
  hindiTitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
        {Icon && <Icon size={16} className="text-saffron" />}
        <h2 className="font-bold text-neutral-800">{title}</h2>
        {hindiTitle && (
          <span
            className="text-xs text-neutral-400"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            · {hindiTitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function MarkdownContent({ md }: { md: string }) {
  const lines = cleanText(md).split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const heading = trimmed.replace(/^#{1,6}\s+/, "");
        if (trimmed.startsWith("## "))
          return <h3 key={i} className="font-bold text-neutral-800 mt-3">{heading}</h3>;
        if (trimmed.startsWith("# "))
          return <h2 key={i} className="font-bold text-neutral-900 mt-3 text-lg">{heading}</h2>;
        if (/^[-*]\s+/.test(trimmed))
          return (
            <p key={i} className="flex items-start gap-2 text-sm text-neutral-700">
              <span className="text-saffron mt-1 shrink-0">•</span>
              <span>{trimmed.replace(/^[-*]\s+/, "")}</span>
            </p>
          );
        if (trimmed === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm text-neutral-700 leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
}

function TextContent({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {cleanText(text).split("\n").filter(Boolean).map((line, i) => (
        <p key={i} className="text-neutral-700 leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}
