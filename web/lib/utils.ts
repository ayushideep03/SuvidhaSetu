import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lakh`;
  if (amount >= 1000) return `₹${amount.toLocaleString("en-IN")}`;
  return `₹${amount}`;
}

export function scoreLabel(score: number): {
  label: string;
  hindiLabel: string;
  className: string;
  icon: string;
} {
  if (score >= 55)
    return {
      label: "Eligible",
      hindiLabel: "पात्र",
      className: "badge-eligible",
      icon: "✅",
    };
  if (score >= 25)
    return {
      label: "Likely Eligible",
      hindiLabel: "संभवतः पात्र",
      className: "badge-likely",
      icon: "⚠️",
    };
  return {
    label: "Not Excluded — Verify",
    hindiLabel: "बाहर नहीं किया गया — जाँचें",
    className: "badge-possible",
    icon: "ℹ️",
  };
}
