import type { GoalDiffPoint } from "../types/goalData";

export default function GoalTrend({ points }: { points: GoalDiffPoint[] }) {
    if (!points.length) return <p className="text-sm text-gray-600">No completed matches to chart yet.</p>;
    const max = Math.max(1, ...points.map(p => Math.abs(p.gd)));
    return <figure><figcaption className="text-sm text-gray-600 mb-4">Match goal difference · oldest to newest</figcaption>
        <div className="flex items-end gap-1 h-36" role="img" aria-label={points.map(p => `${p.date}: ${p.gd}`).join("; ")}>
            {points.map((p, i) => <div key={i} className="flex-1 min-w-0 flex items-end h-full"><div title={`${p.date}: ${p.gd > 0 ? "+" : ""}${p.gd}`} className={`w-full rounded-t ${p.gd < 0 ? "bg-rose-600" : "bg-emerald-600"}`} style={{height: `${Math.max(3, Math.abs(p.gd) / max * 100)}%`}} /></div>)}
        </div><p className="text-xs text-gray-600 mt-2">Green: win or draw · Red: loss · Bar height: absolute goal difference</p>
    </figure>;
}
