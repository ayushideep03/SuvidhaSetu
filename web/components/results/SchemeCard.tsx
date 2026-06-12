import Link from "next/link";
import { ExternalLink, MapPin, Building2 } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import type { SchemeCard as SchemeCardType } from "@/lib/types";
import { cleanText } from "@/lib/text";

interface SchemeCardProps {
  scheme: SchemeCardType;
  showScore?: boolean;
}

export function SchemeCard({ scheme, showScore = true }: SchemeCardProps) {
  return (
    <div className="scheme-card p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/scheme/${scheme.slug}`}
            className="font-bold text-neutral-900 hover:text-saffron transition-colors leading-snug line-clamp-2"
          >
            {scheme.scheme_name}
          </Link>
        </div>
        {showScore && <ScoreBadge score={scheme.score} />}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        {scheme.state && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {scheme.state}
          </span>
        )}
        {!scheme.state && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            All India
          </span>
        )}
        {scheme.ministry && (
          <span className="flex items-center gap-1 truncate max-w-[200px]">
            <Building2 size={11} />
            <span className="truncate">{scheme.ministry}</span>
          </span>
        )}
      </div>

      {/* Benefit highlight */}
      {scheme.monetary_benefit && (
        <div className="inline-flex items-center gap-1.5 bg-saffron-light text-saffron-dark text-sm font-bold px-3 py-1 rounded-lg self-start">
          <span>₹</span>
          {scheme.monetary_benefit.replace("₹", "")}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
        {cleanText(scheme.brief_description)}
      </p>

      {/* Eligibility Explanation */}
      {(scheme.matched?.length > 0 || scheme.gaps?.length > 0) && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mt-2">
          {scheme.matched?.length > 0 && (
            <div className="mb-3 last:mb-0">
              <p className="text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wide">You qualify because:</p>
              <ul className="space-y-1">
                {scheme.matched.map((reason: string, i: number) => (
                  <li key={`matched-${i}`} className="text-sm text-neutral-700 flex items-start gap-2">
                    <span className="text-india-green font-bold shrink-0">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scheme.gaps?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-neutral-800 mb-1.5 uppercase tracking-wide">Missing:</p>
              <ul className="space-y-1">
                {scheme.gaps.map((reason: string, i: number) => (
                  <li key={`gap-${i}`} className="text-sm text-neutral-700 flex items-start gap-2">
                    <span className="text-red-500 font-bold shrink-0">✗</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {scheme.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scheme.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-neutral-100">
        <Link
          href={`/scheme/${scheme.slug}`}
          className="text-sm font-semibold text-saffron hover:text-saffron-dark transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
