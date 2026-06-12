import type {
  UserProfile,
  RankResult,
  SchemeDetail,
  BrowseResult,
  InsightStats,
} from "./types";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (typeof window === "undefined" && process.env.BACKEND_API_URL) {
    return process.env.BACKEND_API_URL.replace(/\/$/, "");
  }

  // Bypassing self-rewrites for SSR on Vercel since it can be flaky.
  // We point directly to the known backend.
  if (typeof window === "undefined") {
    return "https://suvidhasetu-backend.vercel.app";
  }

  // Client-side can safely use the rewrite proxy
  return "/api/backend";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function rankSchemes(profile: UserProfile): Promise<RankResult> {
  return apiFetch<RankResult>("/schemes/rank", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function getSchemeDetail(slug: string): Promise<SchemeDetail> {
  return apiFetch<SchemeDetail>(`/scheme/${encodeURIComponent(slug)}`);
}

export async function getInsightStats(): Promise<InsightStats> {
  return apiFetch<InsightStats>("/insights/stats");
}

export interface BrowseFilters {
  q?: string;
  level?: "State" | "Central";
  state?: string;
  category?: string;
  for_individual?: boolean;
  for_student?: boolean;
  for_farmer?: boolean;
  for_business?: boolean;
  gender_female?: boolean;
  gender_male?: boolean;
  gender_trans?: boolean;
  caste_sc?: boolean;
  caste_st?: boolean;
  caste_obc?: boolean;
  caste_ews?: boolean;
  caste_general?: boolean;
  req_bpl?: boolean;
  req_disabled?: boolean;
  req_widow?: boolean;
  req_minority?: boolean;
  req_exserviceman?: boolean;
  req_orphan?: boolean;
  ministry?: string;
  page?: number;
}

export async function browseSchemes(filters: BrowseFilters = {}): Promise<BrowseResult> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return apiFetch<BrowseResult>(`/schemes/browse${qs ? `?${qs}` : ""}`);
}
