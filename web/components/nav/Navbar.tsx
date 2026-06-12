"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BookOpen, Grid3X3, GitPullRequest } from "lucide-react";
import { AshokaChakra } from "@/components/ui/AshokaChakra";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";

const links = [
  { href: "/find", label: "Find Schemes", hindiLabel: "योजना खोजें", icon: Search },
  { href: "/browse", label: "Browse All", hindiLabel: "सभी देखें", icon: Grid3X3 },
  { href: "/insights", label: "Insights", hindiLabel: "जानकारी", icon: BookOpen },
  { href: "/contribute", label: "Contribute", hindiLabel: "योगदान", icon: GitPullRequest },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-white border-2 border-ashoka-blue flex items-center justify-center shadow-sm">
            <AshokaChakra className="w-7 h-7 text-ashoka-blue" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-none text-ashoka-blue">
              Suvidha Setu
            </p>
            <p
              className="text-xs text-neutral-500 leading-none mt-0.5"
              style={{ fontFamily: "var(--font-devanagari), serif" }}
            >
              सुविधा सेतु
            </p>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, hindiLabel, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-saffron-light text-saffron-dark"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSelector />
          <Link
            href="/find"
            className="shrink-0 bg-saffron hover:bg-saffron-dark text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-150 shadow-sm"
          >
            खोजें
          </Link>
        </div>
      </nav>
      <div className="md:hidden border-t border-neutral-100 px-4 py-2">
        <div className="max-w-6xl mx-auto flex justify-end">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
