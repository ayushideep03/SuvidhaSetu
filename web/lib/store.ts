import { create } from "zustand";
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

  // Actions
  setAnswer: (key: string, value: unknown) => void;
  goToQuestion: (id: string) => void;
  goBack: () => void;
  reset: () => void;
  setResults: (schemes: SchemeCard[], total: number, summary: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useQuestionnaireStore = create<QuestionnaireStore>()((set) => ({
  currentQuestionId: INITIAL_QUESTION,
  history: [],
  profile: {},
  results: null,
  resultsTotal: 0,
  profileSummary: "",
  isLoading: false,
  error: null,

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
    set({
      currentQuestionId: INITIAL_QUESTION,
      history: [],
      profile: {},
      results: null,
      resultsTotal: 0,
      profileSummary: "",
      isLoading: false,
      error: null,
    }),

  setResults: (schemes, total, summary) =>
    set({
      results: schemes,
      resultsTotal: total,
      profileSummary: summary,
      isLoading: false,
    }),

  setLoading: (v) => set({ isLoading: v }),

  setError: (e) => set({ error: e }),
}));
