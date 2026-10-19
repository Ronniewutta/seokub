export default function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-brand-300" : score >= 50 ? "text-amber-300" : "text-red-400";
  return <span className={`font-bold ${color}`}>{score}</span>;
}
