"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, Loader2, Search, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { browseSchemes } from "@/lib/api";
import type { BrowseFilters } from "@/lib/api";
import type { BrowseSchemeCard } from "@/lib/types";
import { STATES } from "@/lib/questions";
import { cleanText } from "@/lib/text";
import { MapPin, Building2 } from "lucide-react";

const CATEGORIES = [
  "Education & Learning",
  "Social welfare & Empowerment",
  "Agriculture,Rural & Environment",
  "Business & Entrepreneurship",
  "Health & Wellness",
  "Science, IT & Communications",
  "Women and Child",
  "Housing & Shelter",
  "Sports & Culture",
  "Banking & Financial Services",
];

const CATEGORY_LABELS: Record<string, string> = {
  "Education & Learning": "Education",
  "Social welfare & Empowerment": "Social Welfare",
  "Agriculture,Rural & Environment": "Agriculture",
  "Business & Entrepreneurship": "Business",
  "Health & Wellness": "Health",
  "Science, IT & Communications": "Science & IT",
  "Women and Child": "Women & Child",
  "Housing & Shelter": "Housing",
  "Sports & Culture": "Sports",
  "Banking & Financial Services": "Banking",
};

type FilterKey = keyof BrowseFilters;

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer ${
        active
          ? "bg-saffron border-saffron text-white"
          : "bg-white border-neutral-200 text-neutral-600 hover:border-saffron hover:text-saffron"
      }`}
    >
      {label}
    </button>
  );
}

function ActiveFilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-saffron-light text-saffron-dark text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors cursor-pointer">
        <X size={11} />
      </button>
    </span>
  );
}

function FilterPanel({
  filters,
  toggle,
  clearAll,
  stateQuery,
  setStateQuery,
}: {
  filters: BrowseFilters;
  toggle: (key: FilterKey, value: unknown) => void;
  clearAll: () => void;
  stateQuery: string;
  setStateQuery: (q: string) => void;
}) {
  const filteredStates = stateQuery
    ? STATES.filter((s) => s.label.toLowerCase().includes(stateQuery.toLowerCase()))
    : STATES;

  return (
    <div className="space-y-5">
      {/* Level */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Scheme Level</p>
        <div className="flex gap-2">
          <FilterChip label="State" active={filters.level === "State"} onClick={() => toggle("level", "State")} />
          <FilterChip label="Central" active={filters.level === "Central"} onClick={() => toggle("level", "Central")} />
        </div>
      </div>

      {/* State */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">State</p>
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={stateQuery}
            onChange={(e) => setStateQuery(e.target.value)}
            placeholder="Search states…"
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-saffron"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {filteredStates.map((s) => (
            <FilterChip
              key={s.value}
              label={s.label}
              active={filters.state === s.value}
              onClick={() => toggle("state", s.value)}
            />
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={CATEGORY_LABELS[cat] ?? cat}
              active={filters.category === cat}
              onClick={() => toggle("category", cat)}
            />
          ))}
        </div>
      </div>

      {/* For whom */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">For Whom</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "Individual", key: "for_individual" as FilterKey },
            { label: "Student", key: "for_student" as FilterKey },
            { label: "Farmer", key: "for_farmer" as FilterKey },
            { label: "Business", key: "for_business" as FilterKey },
          ].map(({ label, key }) => (
            <FilterChip key={key} label={label} active={!!filters[key]} onClick={() => toggle(key, true)} />
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Gender</p>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="Women" active={!!filters.gender_female} onClick={() => toggle("gender_female", true)} />
          <FilterChip label="Men" active={!!filters.gender_male} onClick={() => toggle("gender_male", true)} />
        </div>
      </div>

      {/* Caste */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Caste</p>
        <div className="flex flex-wrap gap-1.5">
          {(["sc", "st", "obc", "ews"] as const).map((c) => (
            <FilterChip
              key={c}
              label={c.toUpperCase()}
              active={!!filters[`caste_${c}` as FilterKey]}
              onClick={() => toggle(`caste_${c}` as FilterKey, true)}
            />
          ))}
        </div>
      </div>

      {/* Special */}
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Special Categories</p>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="BPL" active={!!filters.req_bpl} onClick={() => toggle("req_bpl", true)} />
          <FilterChip label="PwD / Disabled" active={!!filters.req_disabled} onClick={() => toggle("req_disabled", true)} />
          <FilterChip label="Widow" active={!!filters.req_widow} onClick={() => toggle("req_widow", true)} />
          <FilterChip label="Minority" active={!!filters.req_minority} onClick={() => toggle("req_minority", true)} />
          <FilterChip label="Ex-Serviceman" active={!!filters.req_exserviceman} onClick={() => toggle("req_exserviceman", true)} />
        </div>
      </div>

      <button
        onClick={clearAll}
        className="w-full text-xs text-neutral-400 hover:text-red-500 underline text-left pt-1"
      >
        Clear all filters
      </button>
    </div>
  );
}

export default function BrowsePage() {
  const [filters, setFilters] = useState<BrowseFilters>({ page: 1 });
  const [schemes, setSchemes] = useState<BrowseSchemeCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); // true = show spinner on first load
  const [apiError, setApiError] = useState<string | null>(null);
  const [schemeQuery, setSchemeQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const fetchSchemes = useCallback(async (f: BrowseFilters) => {
    setLoading(true);
    setApiError(null);
    try {
      const result = await browseSchemes(f);
      setSchemes(result.schemes);
      setTotal(result.total);
    } catch (e) {
      setSchemes([]);
      setTotal(0);
      setApiError(
        e instanceof Error && e.message.includes("fetch")
          ? "Cannot reach the API server. Make sure the FastAPI backend is running on port 8000."
          : "Something went wrong loading schemes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemes(filters);
  }, [filters, fetchSchemes]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setFilters((prev) => {
        const q = schemeQuery.trim();
        if ((prev.q ?? "") === q) return prev;

        const next = { ...prev, page: 1 };
        if (q) {
          next.q = q;
        } else {
          delete next.q;
        }
        return next;
      });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [schemeQuery]);

  function toggle(key: FilterKey, value: unknown) {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      if (next[key] === value) {
        delete next[key];
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  }

  function clearAll() {
    setFilters({ page: 1 });
    setSchemeQuery("");
    setStateQuery("");
  }

  const activeFilterLabels: { label: string; clear: () => void }[] = [];
  if (filters.q) {
    activeFilterLabels.push({
      label: `Search: ${filters.q}`,
      clear: () => {
        setSchemeQuery("");
        setFilters((prev) => {
          const next = { ...prev, page: 1 };
          delete next.q;
          return next;
        });
      },
    });
  }
  if (filters.level) activeFilterLabels.push({ label: filters.level, clear: () => toggle("level", filters.level) });
  if (filters.state) activeFilterLabels.push({ label: filters.state, clear: () => toggle("state", filters.state) });
  if (filters.category) activeFilterLabels.push({ label: CATEGORY_LABELS[filters.category] ?? filters.category, clear: () => toggle("category", filters.category) });
  if (filters.for_individual) activeFilterLabels.push({ label: "Individual", clear: () => toggle("for_individual", true) });
  if (filters.for_student) activeFilterLabels.push({ label: "Student", clear: () => toggle("for_student", true) });
  if (filters.for_farmer) activeFilterLabels.push({ label: "Farmer", clear: () => toggle("for_farmer", true) });
  if (filters.for_business) activeFilterLabels.push({ label: "Business", clear: () => toggle("for_business", true) });
  if (filters.gender_female) activeFilterLabels.push({ label: "Women", clear: () => toggle("gender_female", true) });
  if (filters.gender_male) activeFilterLabels.push({ label: "Men", clear: () => toggle("gender_male", true) });
  if (filters.caste_sc) activeFilterLabels.push({ label: "SC", clear: () => toggle("caste_sc", true) });
  if (filters.caste_st) activeFilterLabels.push({ label: "ST", clear: () => toggle("caste_st", true) });
  if (filters.caste_obc) activeFilterLabels.push({ label: "OBC", clear: () => toggle("caste_obc", true) });
  if (filters.caste_ews) activeFilterLabels.push({ label: "EWS", clear: () => toggle("caste_ews", true) });
  if (filters.req_bpl) activeFilterLabels.push({ label: "BPL", clear: () => toggle("req_bpl", true) });
  if (filters.req_disabled) activeFilterLabels.push({ label: "Disabled/PwD", clear: () => toggle("req_disabled", true) });
  if (filters.req_widow) activeFilterLabels.push({ label: "Widow", clear: () => toggle("req_widow", true) });
  if (filters.req_minority) activeFilterLabels.push({ label: "Minority", clear: () => toggle("req_minority", true) });
  if (filters.req_exserviceman) activeFilterLabels.push({ label: "Ex-Serviceman", clear: () => toggle("req_exserviceman", true) });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1">Browse All Schemes</h1>
          <p className="text-sm text-neutral-500" style={{ fontFamily: "var(--font-devanagari), serif" }}>
            सभी 4,669 सरकारी योजनाएँ देखें
          </p>
        </div>
        {/* Mobile filter button */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-1.5 text-sm border-2 border-saffron text-saffron px-3 py-2 rounded-xl font-medium shrink-0"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterLabels.length > 0 && (
            <span className="bg-saffron text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-0.5">
              {activeFilterLabels.length}
            </span>
          )}
        </button>
      </div>

      <div className="mb-5 max-w-2xl">
        <label htmlFor="scheme-search" className="sr-only">
          Search schemes
        </label>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="scheme-search"
            type="search"
            value={schemeQuery}
            onChange={(e) => setSchemeQuery(e.target.value)}
            placeholder="Search by scheme name, ministry, category, or tag"
            className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-11 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-saffron focus:ring-2 focus:ring-saffron/15"
          />
          {schemeQuery && (
            <button
              type="button"
              onClick={() => setSchemeQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Clear scheme search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <strong>Backend not reachable.</strong>{" "}
            {apiError}
            <br />
            <code className="text-xs bg-red-100 px-1 py-0.5 rounded mt-1 inline-block">
              cd Scheme-Finder && .venv/bin/uvicorn api.main:app --reload --port 8000
            </code>
          </div>
        </div>
      )}

      {/* Active filter strip */}
      {activeFilterLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeFilterLabels.map(({ label, clear }) => (
            <ActiveFilterTag key={label} label={label} onRemove={clear} />
          ))}
          <button onClick={clearAll} className="text-xs text-neutral-400 hover:text-red-500 underline">
            Clear all
          </button>
        </div>
      )}

      {/* ── Mobile filter drawer ──────────────────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-neutral-500 hover:text-neutral-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel
                filters={filters}
                toggle={toggle}
                clearAll={() => { clearAll(); setMobileFiltersOpen(false); }}
                stateQuery={stateQuery}
                setStateQuery={setStateQuery}
              />
            </div>
            <div className="p-4 border-t border-neutral-100">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-saffron text-white font-semibold py-3 rounded-xl"
              >
                Show {total.toLocaleString("en-IN")} Schemes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Desktop filter panel ──────────────────────────────────── */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 sticky top-24">
            <FilterPanel
              filters={filters}
              toggle={toggle}
              clearAll={clearAll}
              stateQuery={stateQuery}
              setStateQuery={setStateQuery}
            />
          </div>
        </aside>

        {/* ── Results ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-neutral-500">
              {loading
                ? "Loading…"
                : apiError
                  ? "—"
                  : filters.q
                    ? `${total.toLocaleString("en-IN")} schemes matching “${filters.q}”`
                    : `${total.toLocaleString("en-IN")} schemes`}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
              <Loader2 size={32} className="animate-spin text-saffron" />
              <p className="text-sm">Loading schemes…</p>
              <p className="text-xs" style={{ fontFamily: "var(--font-devanagari), serif" }}>
                योजनाएँ लोड हो रही हैं…
              </p>
            </div>
          ) : apiError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm font-medium text-neutral-600">Backend not connected</p>
              <p className="text-xs text-center max-w-xs">
                Start the FastAPI server to browse schemes.
              </p>
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-medium text-neutral-600">
                {filters.q ? "No schemes match this search" : "No schemes match these filters"}
              </p>
              <button onClick={clearAll} className="mt-3 text-saffron underline text-sm">
                Clear search and filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemes.map((scheme, index) => (
                <motion.div
                  key={scheme.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.16) }}
                >
                  <BrowseCard scheme={scheme} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!apiError && total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={!filters.page || filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm disabled:opacity-40 hover:border-saffron transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-neutral-500">
                Page {filters.page ?? 1} of {Math.ceil(total / 20)}
              </span>
              <button
                disabled={(filters.page ?? 1) >= Math.ceil(total / 20)}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-sm disabled:opacity-40 hover:border-saffron transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BrowseCard({ scheme }: { scheme: BrowseSchemeCard }) {
  return (
    <div className="scheme-card p-5 flex flex-col gap-3">
      <div>
        <Link
          href={`/scheme/${scheme.slug}`}
          className="font-bold text-neutral-900 hover:text-saffron transition-colors leading-snug line-clamp-2"
        >
          {scheme.scheme_name}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {scheme.state ?? "All India"}
        </span>
        {scheme.ministry && (
          <span className="flex items-center gap-1 truncate max-w-[180px]">
            <Building2 size={11} />
            <span className="truncate">{scheme.ministry}</span>
          </span>
        )}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          scheme.level === "Central"
            ? "bg-ashoka-blue-light text-ashoka-blue"
            : "bg-india-green-light text-india-green"
        }`}>
          {scheme.level}
        </span>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
        {cleanText(scheme.brief_description)}
      </p>

      {scheme.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scheme.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-neutral-100">
        <Link href={`/scheme/${scheme.slug}`} className="text-sm font-semibold text-saffron hover:text-saffron-dark transition-colors">
          View Details →
        </Link>
      </div>
    </div>
  );
}
