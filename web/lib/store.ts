import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, SchemeCard } from "./types";
import { INITIAL_QUESTION } from "./questions";

interface QuestionnaireStore {
  // Navigation
  currentQuestionId: string;
  history: string[]; // breadcrumb of visited question ids

  // User profile being built
  profile: Partial<UserProfile>;

  // Results (stored after ranking)
  results: SchemeCard[] | null;
  resultsTotal: number;
  profileSummary: string;
  isLoading: boolean;
  error: string | null;

  // User tracking
  savedSchemes: string[];
  viewedSchemes: string[];
  downloadedChecklists: string[];

  // Actions
  setAnswer: (key: string, value: unknown) => void;
  goToQuestion: (id: string) => void;
  goBack: () => void;
  reset: () => void;
  setResults: (schemes: SchemeCard[], total: number, summary: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  addSavedScheme: (slug: string) => void;
  removeSavedScheme: (slug: string) => void;
  addViewedScheme: (slug: string) => void;
  addDownloadedChecklist: (slug: string) => void;
}

export const useQuestionnaireStore = create<QuestionnaireStore>()(
  persist(
    (set) => ({
      currentQuestionId: INITIAL_QUESTION,
      history: [],
      profile: {},
      results: null,
      resultsTotal: 0,
      profileSummary: "",
      isLoading: false,
      error: null,
      savedSchemes: [],
      viewedSchemes: [],
      downloadedChecklists: [],

      setAnswer: (key, value) =>
        set((s) => ({ profile: { ...s.profile, [key]: value } })),

      goToQuestion: (id) =>
        set((s) => ({
          currentQuestionId: id,
          history: [...s.history, s.currentQuestionId],
        })),

      goBack: () =>
        set((s) => {
          const history = [...s.history];
          const prev = history.pop();
          return {
            currentQuestionId: prev ?? INITIAL_QUESTION,
            history,
          };
        }),

      reset: () =>
        set((s) => ({
          currentQuestionId: INITIAL_QUESTION,
          history: [],
          profile: {},
          results: null,
          resultsTotal: 0,
          profileSummary: "",
          isLoading: false,
          error: null,
          // We intentionally don't clear tracking data on reset
        })),

      setResults: (schemes, total, summary) =>
        set({
          results: schemes,
          resultsTotal: total,
          profileSummary: summary,
          isLoading: false,
        }),

      setLoading: (v) => set({ isLoading: v }),

      setError: (e) => set({ error: e }),

      addSavedScheme: (slug) =>
        set((s) => ({
          savedSchemes: s.savedSchemes.includes(slug) ? s.savedSchemes : [...s.savedSchemes, slug],
        })),

      removeSavedScheme: (slug) =>
        set((s) => ({
          savedSchemes: s.savedSchemes.filter((id) => id !== slug),
        })),

      addViewedScheme: (slug) =>
        set((s) => ({
          viewedSchemes: s.viewedSchemes.includes(slug) ? s.viewedSchemes : [...s.viewedSchemes, slug],
        })),

      addDownloadedChecklist: (slug) =>
        set((s) => ({
          downloadedChecklists: s.downloadedChecklists.includes(slug) ? s.downloadedChecklists : [...s.downloadedChecklists, slug],
        })),
    }),
    {
      name: "suvidhasetu-storage",
      partialize: (state) => ({
        profile: state.profile,
        savedSchemes: state.savedSchemes,
        viewedSchemes: state.viewedSchemes,
        downloadedChecklists: state.downloadedChecklists,
      }),
    }
  )
);
