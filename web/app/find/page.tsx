"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuestionnaireStore } from "@/lib/store";
import { QUESTIONS, getNextQuestion } from "@/lib/questions";
import { rankSchemes } from "@/lib/api";
import { ChipOption } from "@/components/questionnaire/ChipOption";
import { StateSearch } from "@/components/questionnaire/StateSearch";
import { NumberInput } from "@/components/questionnaire/NumberInput";
import type { UserProfile } from "@/lib/types";

export default function FindPage() {
  const router = useRouter();
  const {
    currentQuestionId,
    history,
    profile,
    results,
    isLoading,
    error,
    setAnswer,
    goToQuestion,
    goBack,
    setResults,
    setLoading,
    setError,
    reset,
  } = useQuestionnaireStore();

  const question = QUESTIONS[currentQuestionId];
  const totalSteps = history.length + 1;
  const progress = Math.min((history.length / 12) * 100, 95);
  const hasSavedProgress =
    history.length > 0 ||
    Object.keys(profile).length > 0 ||
    Boolean(results);

  // Multi-select local state
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  useEffect(() => {
    if (question?.type === "multi_select" && question.multiKey) {
      const existing = (profile as Record<string, unknown>)[question.multiKey];
      setMultiSelected(Array.isArray(existing) ? existing : []);
    }
  }, [currentQuestionId, question, profile]);

  // Number input local state
  const [numValue, setNumValue] = useState<number | "">("");
  useEffect(() => {
    if (question?.type === "number_input") {
      const existing = (profile as Record<string, unknown>)[question.profileKey];
      setNumValue(typeof existing === "number" ? existing : "");
    }
  }, [currentQuestionId, question, profile]);

  const advance = useCallback(
    async (nextId: string | null, answerKey: string, value: unknown) => {
      setAnswer(answerKey, value);

      if (nextId === null) {
        // Terminal — submit
        const finalProfile = {
          ...profile,
          [answerKey]: value,
        } as UserProfile;

        setLoading(true);
        setError(null);
        try {
          const result = await rankSchemes(finalProfile);
          setResults(result.schemes, result.total, result.profile_summary);
          router.push("/results");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load schemes. Is the API running?");
          setLoading(false);
        }
        return;
      }

      goToQuestion(nextId);
    },
    [profile, setAnswer, goToQuestion, setLoading, setError, setResults, router]
  );

  const handleSingleChoice = useCallback(
    (value: string) => {
      const next = getNextQuestion(currentQuestionId, value);
      advance(next, question.profileKey as string, value);
    },
    [currentQuestionId, question, advance]
  );

  const handleMultiContinue = useCallback(() => {
    const key = question.multiKey ?? (question.profileKey as string);
    const next = getNextQuestion(currentQuestionId, multiSelected);
    advance(next, key, multiSelected);
  }, [currentQuestionId, question, multiSelected, advance]);

  const handleNumberNext = useCallback(() => {
    if (numValue === "") return;
    const next = getNextQuestion(currentQuestionId, numValue);
    advance(next, question.profileKey as string, numValue);
  }, [currentQuestionId, question, numValue, advance]);

  const toggleMulti = useCallback((value: string) => {
    setMultiSelected((prev) => {
      if (value === "none") return ["none"];
      const withoutNone = prev.filter((v) => v !== "none");
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  }, []);

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-500">
        Question not found.{" "}
        <button onClick={reset} className="ml-2 text-saffron underline">
          Restart
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-warm-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2 text-xs text-neutral-500">
            <span>Step {history.length + 1}</span>
            {hasSavedProgress ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-india-green font-medium transition-colors"
              >
                <RotateCcw size={12} />
                Start over
              </button>
            ) : (
              <span>Finding your scheme…</span>
            )}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionId}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-neutral-100 bg-white/80 p-5 shadow-[0_18px_55px_rgba(19,136,8,0.08)] backdrop-blur sm:p-7"
            >
          {/* Back button */}
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6 transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          )}

          {/* Prompt */}
          <div className="mb-8">
            <p className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-snug mb-2">
              {question.prompt}
            </p>
            {question.hindiPrompt && (
              <p
                className="text-base text-neutral-400"
                style={{ fontFamily: "var(--font-devanagari), serif" }}
              >
                {question.hindiPrompt}
              </p>
            )}
            {history.length === 0 && (
              <div className="mt-5 rounded-xl border border-india-green/20 bg-india-green-light/70 px-4 py-3 text-xs leading-relaxed text-neutral-700">
                <p className="font-semibold text-india-green mb-1">Privacy first</p>
                <p>
                  Your answers can include sensitive details. Suvidha Setu uses them only to calculate matches,
                  does not store them in your browser, and does not save them on the server. When you submit,
                  answers are sent to the backend for matching and then discarded by the app.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl space-y-2">
              <p className="font-semibold">Could not load schemes</p>
              <p>{error}</p>
              <p className="text-xs text-red-500">
                Make sure the backend is running:{" "}
                <code className="bg-red-100 px-1 rounded">
                  .venv/bin/uvicorn api.main:app --reload --port 8000
                </code>
              </p>
              <button onClick={() => setError(null)} className="underline text-xs">
                Dismiss
              </button>
            </div>
          )}

          {/* ── Single choice ─────────────────────────────────────── */}
          {question.type === "single_choice" && question.options && (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {question.options.map((opt) => (
                <ChipOption
                  key={opt.value}
                  label={opt.label}
                  hindiLabel={opt.hindiLabel}
                  emoji={opt.emoji}
                  selected={
                    (profile as Record<string, unknown>)[
                      question.profileKey as string
                    ] === opt.value
                  }
                  onClick={() => handleSingleChoice(opt.value)}
                />
              ))}
            </div>
          )}

          {/* ── State search ──────────────────────────────────────── */}
          {question.type === "state_search" && question.options && (
            <div className="flex flex-col gap-4">
              <StateSearch
                options={question.options}
                value={
                  ((profile as Record<string, unknown>)[
                    question.profileKey as string
                  ] as string) ?? ""
                }
                onChange={(v) => {
                  const next = getNextQuestion(currentQuestionId, v);
                  advance(next, question.profileKey as string, v);
                }}
              />
            </div>
          )}

          {/* ── Number input ──────────────────────────────────────── */}
          {question.type === "number_input" && (
            <div className="flex flex-col items-center gap-6">
              <NumberInput
                value={numValue}
                onChange={setNumValue}
                min={question.min ?? 0}
                max={question.max ?? 999}
                unit={question.unit}
              />
              <button
                onClick={handleNumberNext}
                disabled={numValue === "" || isLoading}
                className="flex items-center gap-2 bg-saffron hover:bg-saffron-dark disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue →
              </button>
            </div>
          )}

          {/* ── Multi select ──────────────────────────────────────── */}
          {question.type === "multi_select" && question.options && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                {question.options.map((opt) => (
                  <ChipOption
                    key={opt.value}
                    label={opt.label}
                    hindiLabel={opt.hindiLabel}
                    emoji={opt.emoji}
                    selected={multiSelected.includes(opt.value)}
                    onClick={() => toggleMulti(opt.value)}
                    multiSelect
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleMultiContinue}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-saffron hover:bg-saffron-dark disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full transition-colors"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  <span>
                    {getNextQuestion(currentQuestionId, multiSelected) === null
                      ? "Find My Schemes 🎯"
                      : "Continue →"}
                  </span>
                </button>
                {question.optional && (
                  <button
                    onClick={handleMultiContinue}
                    className="text-sm text-neutral-400 hover:text-neutral-600 underline"
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="mt-8 flex flex-col items-center gap-3 text-neutral-500">
              <Loader2 size={28} className="animate-spin text-saffron" />
              <p className="text-sm">
                Searching through 4,669 schemes…
              </p>
              <p
                className="text-xs text-neutral-400"
                style={{ fontFamily: "var(--font-devanagari), serif" }}
              >
                योजनाएँ खोजी जा रही हैं…
              </p>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
