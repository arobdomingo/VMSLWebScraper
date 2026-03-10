import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useLocation } from "react-router-dom"
import { apiGet } from "../api/client"
import type { ScorerRow, PoolScorers, ScorersResponse } from "../types/scorers";

function DivisionScorers(){

    const { year, division, teamSlug } = useParams();

    const [data, setData] = useState<ScorersResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");

    //query shows rank within query

    useEffect(() => {
        setLoading(true)
        setError(null)

        apiGet<ScorersResponse>(`/divisions/${year}/${division}/scorers`)
            .then(setData)
            .catch((e) => setError(e.message ?? String(e)))
            .finally(() => setLoading(false))
    }, [year, division])

    const allScorers = useMemo(() => {
        const list = data?.pools.flatMap((pool) => pool.scorers) ?? []
        return list
    }, [data])

    const leagueRank = useMemo(() => {
        const map = new Map<string, number>()
        allScorers.forEach((scorer, index) => {
            const key = `${scorer.player_name}_${scorer.team_name}`
            if(!map.has(key)) map.set(key, index + 1)
        })
        return map
    }, [allScorers])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if(!q) return allScorers

        return allScorers.filter(
            (scorer) =>
                scorer.player_name.toLowerCase().includes(q) ||
                scorer.team_name.toLowerCase().includes(q)
        )
    }, [allScorers, query])

    const location = useLocation();
    const selectedTeam = (location.state as any)?.selectedTeam as string | undefined;
    console.log(selectedTeam)

    return(
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Division Scorers</h1>

                {year && division && teamSlug && (

                    <Link
                        to={`/team/${year}/${division}/${teamSlug}`}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Back to Team Hub
                    </Link>

                )}
            </div>

            <div className="rounded-lg border bg-white p-4 text-sm">
                <div>
                    <span className="font-medium">Year:</span> {year}
                </div>
                <div>
                    <span className="font-medium">Division:</span> {division}
                </div>
                {selectedTeam && (
                    <div>
                        <div>
                            <span className="font-medium">Team:</span> {selectedTeam}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-lg border bg-white p-4">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search player..."
                    className="w-full rounded-md border px-3 py-2 text-sm"
                >
                </input>
            </div>

            {loading && (
                <div className="rounded-lg border bg-white p-4">
                    Loading division scorers...
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    {error}
                </div>
            )}

            {data && (
                <div className="rounded-lg border bg-white">
                    <div className="grid grid-cols-12 border-b px-4 py-2 text-xs font-semibold text-gray-500">
                        <div className="col-span-2">Rank</div>
                        <div className="col-span-7">Player</div>
                        <div className="col-span-3">Goals</div>
                    </div>

                    <div className="divide-y">
                        {filtered.map((scorer, idx) => {
                            const isHighlighted = scorer.team_name === selectedTeam

                            return(
                                <div
                                    key={`${scorer.player_name}-${idx}`}
                                    className={`grid grid-cols-12 px-4 py-3 text-sm ${isHighlighted ? "bg-blue-50" : ""}`}
                                >
                                    <div className="col-span-2 text-gray-600 tabular-nums">
                                        {leagueRank.get(`${scorer.player_name}_${scorer.team_name}`) ?? "-"}
                                    </div>

                                    <div className="col-span-7 min-w-0">
                                        <div
                                            className={`truncate ${isHighlighted ? "font-semibold" : "font-medium"}`}
                                        >
                                            {scorer.player_name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {scorer.team_name}
                                        </div>
                                    </div>

                                    <div className="col-span-3 font-semibold tabular-nums">
                                        {scorer.goals}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )


}

export default DivisionScorers