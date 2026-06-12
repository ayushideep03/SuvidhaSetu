import Link from "next/link";
import { Code2, Heart } from "lucide-react";

const GITHUB_URL = "https://github.com/Ayushideep/SuvidhaSetu";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white mt-auto">
      <div className="rangoli-border opacity-60" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold text-saffron mb-1">Suvidha Setu</p>
            <p
              className="text-sm text-neutral-500 mb-4"
              style={{ fontFamily: "var(--font-devanagari), serif" }}
            >
              सुविधा सेतु
            </p>
            <p className="text-neutral-500 text-xs leading-relaxed">
              Intelligently matching citizens with India&apos;s government schemes since 2026.
              Not affiliated with myscheme.gov.in.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Navigate
            </p>
            <ul className="space-y-2">
              {[
                { href: "/find", label: "Find Your Scheme" },
                { href: "/browse", label: "Browse All Schemes" },
                { href: "/insights", label: "Data Insights" },
                { href: "/insights/how-it-works", label: "How It Works" },
                { href: "/insights/launch-notes", label: "Launch Notes" },
                { href: "/contribute", label: "Contribute" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-neutral-400 hover:text-saffron text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-saffron text-sm transition-colors"
                >
                  <Code2 size={13} />
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Data */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Data
            </p>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>4,669 schemes indexed</li>
              <li>37 states &amp; UTs covered</li>
              <li>Source: myscheme.gov.in API</li>
              <li>Translations cover page and scheme text via Google Translate</li>
              <li>Updated June 2026</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-saffron/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 shadow-sm">
            Built with
            <Heart size={14} className="fill-saffron text-saffron" aria-label="love" />
            and safety by
            <strong className="font-bold text-white">Ayushideep</strong>
          </p>
          <p
            className="text-neutral-500 text-xs"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            जय हिन्द
          </p>
        </div>
      </div>
    </footer>
  );
}
