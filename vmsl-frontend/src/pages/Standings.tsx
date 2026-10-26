import StandingsTable from "../components/StandingsTable";
import { LoadingMessage, ErrorMessage } from "../components/RequestFeedback";

import { Link, useLocation, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import type { StandingsResponse } from "../types/standings.ts"

type LocationState = { highlightTeam?: string}

function Standings(){

    const { year, division } = useParams();
    const location = useLocation();
    const highlightTeam = (location.state as LocationState | null)?.highlightTeam;
    const {data, loading, error} = useApi<StandingsResponse>(`/divisions/${year}/${division}/standings`);

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
                <LoadingMessage>Loading standings...</LoadingMessage>
            )}

            {error && (
                <ErrorMessage message={error} />
            )}

            {data && (
                <div className="space-y-6">
                    {data.pools.length === 0 && <p>No standings published yet.</p>}
                    {data.pools.map((pool, poolIdx) =>
                        <div key={poolIdx} className="rounded-lg border bg-white p-6">
                            {pool.pool_name && (
                                <div className="mb-3 text-sm font-semibold text-gray-700">
                                    {pool.pool_name}
                                </div>
                            )}

                            <StandingsTable pool={pool} year={year} division={division} highlightTeam={highlightTeam} />
                            {pool.teams.length === 0 && <p className="p-4">No standings published yet.</p>}
                        </div>
                    )}
                </div>
            )}
            
        </div>
    )

}

export default Standings