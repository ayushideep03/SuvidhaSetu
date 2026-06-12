"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuestionnaireStore } from "@/lib/store";
import { SchemeCard } from "@/components/results/SchemeCard";

export default function ResultsPage() {
  const router = useRouter();
  const { results, resultsTotal, profileSummary, reset } =
    useQuestionnaireStore();
  const [query, setQuery] = useState("");
  const filteredResults = useMemo(() => {
    if (!results) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return results;

    return results.filter((scheme) =>
      [
        scheme.scheme_name,
        scheme.ministry,
        scheme.state,
        scheme.category,
        scheme.brief_description,
        scheme.monetary_benefit,
        ...(scheme.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, results]);

  if (!results) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">Search</p>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          No saved results yet
        </h1>
        <p className="text-neutral-500 mb-6">
          Run the questionnaire to find schemes matched to your profile.
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Find Schemes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/find"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to questionnaire
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">
              Your Matched Schemes
            </h1>
            {profileSummary && (
              <p className="text-sm text-neutral-500 flex items-center gap-1.5">
                <Search size={12} />
                {profileSummary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-sm font-semibold text-saffron">
              {query.trim()
                ? `${filteredResults.length} of ${results.length} matched`
                : `${results.length} of ${resultsTotal.toLocaleString("en-IN")} shown`}
            </p>
            <button
              onClick={() => {
                reset();
                router.push("/find");
              }}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 border border-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw size={13} />
              Restart
            </button>
          </div>
        </div>

        {/* Profile summary strip */}
        {profileSummary && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profileSummary.split(" · ").map((part) => (
              <span
                key={part}
                className="text-xs bg-ashoka-blue-light text-ashoka-blue px-2.5 py-1 rounded-full font-medium"
              >
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 max-w-xl">
        <label htmlFor="matched-scheme-search" className="sr-only">
          Search matched schemes
        </label>
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="matched-scheme-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within your matched schemes"
            className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-india-green focus:ring-2 focus:ring-india-green/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Clear matched scheme search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Score legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-india-green inline-block" />
          ✅ Likely Eligible (90+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          ⚠️ Possibly Eligible (60–89)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-ashoka-blue inline-block" />
          ℹ️ Additional Verification Needed (&lt;60)
        </span>
      </div>
      <p className="mb-6 rounded-xl border border-ashoka-blue/15 bg-ashoka-blue-light px-4 py-3 text-xs leading-relaxed text-neutral-700">
        Scores are a matching aid, not an official eligibility decision. “Additional Verification Needed” means the app
        could not rule the scheme out, but you may need to verify specific fields. Check the official scheme page
        before spending time on an application.
      </p>

      {/* Results grid */}
      {results.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-neutral-600 mb-1">
            No schemes found
          </p>
          <p
            className="text-sm mb-6"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            कोई योजना नहीं मिली
          </p>
          <button
            onClick={() => {
              reset();
              router.push("/find");
            }}
            className="text-saffron underline text-sm"
          >
            Try again with different answers
          </button>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-neutral-600 mb-1">
            No matched schemes found for this search
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-3 text-saffron underline text-sm"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredResults.map((scheme, index) => (
            <motion.div
              key={scheme.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.2) }}
            >
              <SchemeCard scheme={scheme} showScore />
            </motion.div>
          ))}
        </div>
      )}

      {/* Browse all CTA */}
      <div className="mt-10 text-center">
        <p className="text-sm text-neutral-500 mb-3">
          Want to explore all 4,669 schemes on your own?
        </p>
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 border-2 border-saffron text-saffron hover:bg-saffron hover:text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
        >
          Browse All Schemes
        </Link>
      </div>
    </div>
  );
}
