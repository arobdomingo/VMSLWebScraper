import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiGet } from "../api/client";
import type { StandingsResponse } from "../types/standings.ts"

type LocationState = { highlightTeam?: string}

function Standings(){

    const { year, division } = useParams();
    const location = useLocation();
    const highlightTeam = (location.state as LocationState | null)?.highlightTeam;

    const [data, setData] = useState<StandingsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    
        setLoading(true);
        setError(null);

        apiGet<StandingsResponse>(`/divisions/${year}/${division}/standings`)
            .then(setData)
            .catch((e) => setError(e.message ?? String(e)))
            .finally(() => setLoading(false));
        
    }, [year, division]);

    return (
        <div className="space-y-4">

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Full Table</h1>
                <Link to="/" className="text-sm text-blue-600 hover:underline">
                    Back to team picker
                </Link>
            </div>

            <div className="rounded-lg border bg-white p-4 text-sm">
                <div>
                    <span className="font-medium">Year:</span> {year}
                </div>
                <div>
                    <span className="font-medium">Division: </span> {division}
                </div>
            </div>

            {loading && (
                <div className="rounded-lg border bg-white p-4">Loading standings...</div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="font-medium">Request failed</div>
                    <div className="mt-1 text-sm">{error}</div>
                </div>
            )}

            {data && (
                <div className="space-y-6">
                    {data.pools.map((pool, poolIdx) =>
                        <div key={poolIdx} className="rounded-lg border bg-white p-6">
                            {pool.pool_name && (
                                <div className="mb-3 text-sm font-semibold text-gray-700">
                                    {pool.pool_name}
                                </div>
                            )}

                            <div className="grid grid-cols-13 gap-2 border-b pb-2 text-xs font-semibold text-gray-500">
                                <div className="col-span-1">Pos</div>
                                <div className="col-span-6">Team</div>
                                <div className="col-span-1">GP</div>
                                <div className="col-span-1">Pts</div>
                                <div className="col-span-1">W</div>
                                <div className="col-span-1">D</div>
                                <div className="col-span-1">L</div>
                                <div className="col-span-1">GD</div>
                            </div>

                            <div className="mt-2 space-y-1">
                                {pool.teams.map((team, idx) => {
                                    const toHighlight = team.team_name === highlightTeam;

                                    return (
                                        <div
                                            key={idx}
                                            className={
                                                "grid grid-cols-13 gap-2 rounded-md px-2 py-2 text-sm " + 
                                                (toHighlight ? "bg-blue-50 border border-blue-200" : "")
                                            }
                                        >
                                            <div className="col-span-1 font-medium">{team.position}</div>
                                            <div className="col-span-6 text-sm font-medium">{team.team_name}</div>

                                            <div className="col-span-1 text-right">{team.games_played}</div>
                                            <div className="col-span-1 text-right font-semibold">{team.points}</div>
                                            <div className="col-span-1 text-right">{team.wins}</div>
                                            <div className="col-span-1 text-right">{team.draws}</div>
                                            <div className="col-span-1 text-right">{team.losses}</div>
                                            <div className="col-span-1 text-right">{team.goal_diff}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
        </div>
    )

}

export default Standings