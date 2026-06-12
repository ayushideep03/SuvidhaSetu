"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Languages } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "ta", label: "தமிழ்" },
  { code: "ur", label: "اردو" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "as", label: "অসমীয়া" },
];

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function setTranslateCookie(lang: string) {
  const value = lang === "en" ? "" : `/en/${lang}`;
  const maxAge = lang === "en" ? "Max-Age=0" : "Max-Age=31536000";
  document.cookie = `googtrans=${value}; Path=/; ${maxAge}; SameSite=Lax`;

  const host = window.location.hostname;
  if (host.includes(".")) {
    document.cookie = `googtrans=${value}; Path=/; Domain=.${host}; ${maxAge}; SameSite=Lax`;
  }
}

function applyGoogleTranslate(lang: string) {
  setTranslateCookie(lang);

  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) {
    if (lang !== "en") window.location.reload();
    return;
  }

  combo.value = lang === "en" ? "" : lang;
  combo.dispatchEvent(new Event("change"));

  if (lang === "en") {
    window.location.reload();
  }
}

export function LanguageSelector() {
  const [language, setLanguage] = useState("en");
  const initialized = useRef(false);
  const includedLanguages = useMemo(
    () => LANGUAGES.filter((l) => l.code !== "en").map((l) => l.code).join(","),
    []
  );

  useEffect(() => {
    localStorage.removeItem("suvidhasetu-questionnaire");
    const stored = localStorage.getItem("suvidhasetu-language") || "en";
    setLanguage(stored);

    if (initialized.current) return;
    initialized.current = true;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [includedLanguages]);

  function handleChange(nextLanguage: string) {
    setLanguage(nextLanguage);
    localStorage.setItem("suvidhasetu-language", nextLanguage);
    applyGoogleTranslate(nextLanguage);
  }

  return (
    <div className="relative flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5">
        <Languages size={15} className="text-ashoka-blue shrink-0" aria-hidden />
        <label htmlFor="language-select" className="sr-only">
          Language
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(event) => handleChange(event.target.value)}
          className="max-w-[8.5rem] rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-medium text-neutral-700 outline-none transition-colors hover:border-india-green focus:border-india-green"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
      <p className="hidden lg:block text-[10px] leading-none text-neutral-400">
        Auto-translates page and scheme text
      </p>
      <div id="google_translate_element" className="hidden" />
    </div>
  );
}
