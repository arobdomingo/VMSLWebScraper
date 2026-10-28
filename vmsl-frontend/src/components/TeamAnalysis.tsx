import { useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import type { TeamAnalysis as Analysis, Comparison } from '../types/analysis';
import { LoadingMessage, ErrorMessage } from './RequestFeedback';
const rate = (value: number | null) => value == null ? '—' : value.toFixed(2);

export function Difficulty({ data }: { data: Analysis | null }) {
    const difficulty = data?.next_difficulty;
    if (!difficulty) return null;
    return <details className="mt-3 rounded-md border bg-gray-50 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Fixture difficulty: {difficulty.label}</summary>
        {difficulty.opponent_ppg != null && <span> · {rate(difficulty.opponent_ppg)} opponent PPG ({difficulty.opponent_games} played)</span>}
        <p className="mt-1 text-xs text-gray-600">Current pool points per game: High ≥ 2, Medium ≥ 1, Low &lt; 1. A descriptive indicator, not a prediction. Unavailable for unplayed teams or other pools.</p>
    </details>;
}
function Snapshot({ team }: { team: Comparison }) {
    return <div className="rounded-md border p-4 min-w-0">
        <h3 className="font-semibold break-words">{team.team_name}</h3>
        <p className="text-xs text-gray-600 mb-3">{team.pool_name || 'Division'} · Position {team.position}</p>
        <dl className="grid grid-cols-3 gap-2 text-sm">
            {([['Pts/game', team.points_per_game], ['GF/game', team.gf_per_game], ['GA/game', team.ga_per_game]] as const).map(([label, value]) => <div key={label}><dt className="text-xs text-gray-600">{label}</dt><dd className="font-semibold">{rate(value)}</dd></div>)}
        </dl>
        <p className="mt-3 text-sm">Last five: {team.form.map(m => m.result).join(' · ') || 'No completed matches'}</p>
    </div>;
}
export default function TeamAnalysis({ year, division, teamSlug, data, loading, error }: {
    year: string; division: string; teamSlug: string; data: Analysis | null; loading: boolean; error: string | null;
}) {
    const [params, setParams] = useSearchParams();
    const selected = params.get('opponent') || '';
    const { data: headToHead, loading: comparing, error: compareError } = useApi<Analysis>(selected ? `/teams/${division}/${teamSlug}/analysis?year=${year}&opponent_slug=${encodeURIComponent(selected)}` : null);
    return <section className="space-y-4" aria-label="Team comparisons">
        {loading && <LoadingMessage>Loading team analysis…</LoadingMessage>}
        {error && <ErrorMessage message={error} />}
        {data && <>
            <div className="rounded-lg border bg-white p-6">
                <h2 className="text-xl font-semibold mb-4">Home &amp; away</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(['home', 'away'] as const).map(venue => {
                        const split = data[venue];
                        return <div key={venue} className="rounded-md border p-4">
                            <h3 className="font-semibold capitalize">{venue} <span className="text-sm font-normal text-gray-600">· {split.games_played} played</span></h3>
                            {split.games_played ? <>
                                <p className="mt-2 text-sm">{split.wins} W · {split.draws} D · {split.losses} L</p>
                                <dl className="grid grid-cols-3 gap-2 mt-3 text-sm">{([['Pts/game', split.points_per_game], ['GF/game', split.gf_per_game], ['GA/game', split.ga_per_game]] as const).map(([label,value]) => <div key={label}><dt className="text-xs text-gray-600">{label}</dt><dd className="font-bold">{rate(value)}</dd></div>)}</dl>
                                <p className="mt-3 text-sm">{split.clean_sheets} clean sheets · {split.goals_for} scored · {split.goals_against} conceded</p>
                            </> : <p className="mt-2 text-sm text-gray-600">No completed {venue} fixtures.</p>}
                        </div>;
                    })}
                </div>
                <p className="mt-3 text-xs text-gray-600">Calculated from available completed fixtures using 3 points for a win and 1 for a draw. Official totals may include adjustments.</p>
            </div>
            <div className="rounded-lg border bg-white p-6 space-y-4">
                <h2 className="text-xl font-semibold">Head to head</h2>
                <label htmlFor="compare-opponent" className="block text-sm font-medium">Compare with</label>
                <select id="compare-opponent" value={selected} onChange={e => { const next = new URLSearchParams(params); if(e.target.value) next.set('opponent', e.target.value); else next.delete('opponent'); setParams(next, { replace: true }); }} className="w-full rounded-md border px-3 py-2">
                    <option value="">Choose an opponent</option>
                    {data.opponents.map(team => <option key={team.team_slug} value={team.team_slug}>{team.team_name}{team.pool_name ? ` · ${team.pool_name}` : ''}</option>)}
                </select>
                {data.opponents.length === 0 && <p className="text-sm text-gray-600">No other teams available in this division.</p>}
                {comparing && <LoadingMessage>Loading comparison…</LoadingMessage>}
                {compareError && <ErrorMessage message={compareError} />}
                {headToHead?.opponent && <>
                    <p className="text-xs text-gray-600">Season ending {year} · Division {division} · Same-season records only. Form runs oldest to newest; pool positions are not a combined ranking.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Snapshot team={headToHead.team} /><Snapshot team={headToHead.opponent} /></div>
                    <h3 className="font-semibold">Meetings this season</h3>
                    {headToHead.meetings.length === 0 ? <p className="text-sm text-gray-600">No completed meetings in the available schedule.</p> : <ul className="divide-y">{headToHead.meetings.map((m,i) => <li key={`${m.date}-${i}`} className="py-3 flex flex-wrap justify-between gap-2 text-sm"><span>{m.date} · {m.is_home ? 'Home' : 'Away'}</span><span className="font-semibold">{m.goals_for}–{m.goals_against} ({m.result})</span></li>)}</ul>}
                </>}
            </div>
        </>}
    </section>;
}
