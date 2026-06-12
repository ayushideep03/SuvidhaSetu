import { scoreLabel } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  showHindi?: boolean;
}

export function ScoreBadge({ score, showHindi = false }: ScoreBadgeProps) {
  const { label, hindiLabel, className, icon } = scoreLabel(score);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
    >
      <span>{icon}</span>
      <span>{showHindi ? hindiLabel : label}</span>
      <span className="text-xs opacity-60">({score})</span>
    </span>
  );
}
