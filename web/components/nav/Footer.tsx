import Link from "next/link";
import { Code2, Heart } from "lucide-react";

const GITHUB_URL = "https://github.com/Ayushideep/SuvidhaSetu";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white mt-auto text-xs">
      <div className="rangoli-border opacity-60 h-1" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
          
          {/* Brand */}
          <div className="text-center md:text-left flex-1">
            <p className="text-sm font-bold text-saffron inline-flex items-center gap-2">
              Suvidha Setu
              <span className="text-neutral-500 font-normal" style={{ fontFamily: "var(--font-devanagari), serif" }}>सुविधा सेतु</span>
            </p>
            <p className="text-neutral-500 mt-1 max-w-sm mx-auto md:mx-0">
              Intelligently matching citizens with India&apos;s government schemes. Not affiliated with myscheme.gov.in.
            </p>
          </div>

          {/* Links */}
          <div className="flex-1 flex justify-center md:justify-end">
            <ul className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2 max-w-lg">
              {[
                { href: "/find", label: "Find Scheme" },
                { href: "/browse", label: "Browse" },
                { href: "/insights", label: "Insights" },
                { href: "/insights/how-it-works", label: "How It Works" },
                { href: "/contribute", label: "Contribute" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-neutral-400 hover:text-saffron transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-neutral-400 hover:text-saffron transition-colors">
                  <Code2 size={12} /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-neutral-500 flex gap-3 text-[10px]">
            <span>4,669 schemes</span>
            <span>37 states &amp; UTs</span>
            <span>Updated June 2026</span>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
              Built with <Heart size={10} className="fill-saffron text-saffron" /> by <strong className="text-white">Ayushideep</strong>
            </p>
            <p className="text-neutral-500 text-[10px]" style={{ fontFamily: "var(--font-devanagari), serif" }}>जय हिन्द</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
