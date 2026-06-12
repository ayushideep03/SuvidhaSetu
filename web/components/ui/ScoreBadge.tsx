import { scoreLabel } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  showHindi?: boolean;
}

export function ScoreBadge({ score, showHindi = false }: ScoreBadgeProps) {
  const { label, hindiLabel, className, icon } = scoreLabel(score);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-sm font-black text-neutral-800">{score}% Match</div>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${className}`}
      >
        <span>{icon}</span>
        <span>{showHindi ? hindiLabel : label}</span>
      </span>
    </div>
  );
}
