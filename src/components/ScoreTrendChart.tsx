interface Point {
  date: string;
  score: number;
}

export default function ScoreTrendChart({
  points,
  title,
  subtitle,
  sinceLabel,
}: {
  points: Point[];
  title: string;
  subtitle: string;
  sinceLabel: string;
}) {
  if (points.length === 0) return null;

  const width = 720;
  const height = 240;
  const padX = 40;
  const padY = 36;

  const n = points.length;
  const x = (i: number) =>
    n === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (n - 1);
  const y = (score: number) =>
    height - padY - (score / 100) * (height - padY * 2);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${height - padY} L ${x(0).toFixed(1)} ${height - padY} Z`;

  const lastScore = points[n - 1].score;
  const firstScore = points[0].score;
  const delta = lastScore - firstScore;

  const labelEvery = Math.max(1, Math.ceil(n / 5));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        </div>
        {n > 1 && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              delta >= 0
                ? "bg-brand-500/10 text-brand-300"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} {sinceLabel}
          </span>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[560px]">
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padX}
                x2={width - padX}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 8}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize="11"
                fill="#71717a"
              >
                {tick}
              </text>
            </g>
          ))}

          {n > 1 && (
            <>
              <path d={area} fill="url(#scoreFill)" />
              <path
                d={line}
                fill="none"
                stroke="#a3e635"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {points.map((p, i) => (
            <g key={`${p.date}-${i}`}>
              <circle
                cx={x(i)}
                cy={y(p.score)}
                r="5"
                fill="#09090b"
                stroke="#a3e635"
                strokeWidth="2.5"
              />
              {i % labelEvery === 0 || i === n - 1 ? (
                <text
                  x={x(i)}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#71717a"
                >
                  {p.date}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
