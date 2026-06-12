export function AshokaChakra({ className }: { className?: string }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i);
  const cx = 100;
  const cy = 100;
  const r = 84;

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r - 8} stroke="currentColor" strokeWidth="1.8" />
      <circle cx={cx} cy={cy} r="7" fill="currentColor" />
      {spokes.map((i) => {
        const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
        const x1 = +(cx + 9 * Math.cos(angle)).toFixed(3);
        const y1 = +(cy + 9 * Math.sin(angle)).toFixed(3);
        const x2 = +(cx + (r - 10) * Math.cos(angle)).toFixed(3);
        const y2 = +(cy + (r - 10) * Math.sin(angle)).toFixed(3);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
