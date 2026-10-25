
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

                            <p className="text-xs text-gray-600 mb-3 md:hidden">Scroll the table horizontally to see all statistics.</p>
                            <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable division standings"><table>
                                <caption className="sr-only">Division {division} standings, season ending {year}, {pool.pool_name || "all teams"}</caption>
                                <thead><tr>{["Pos", "Team", "GP", "Pts", "W", "D", "L", "GD"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                                <tbody>{pool.teams.map(team => <tr key={team.team_name} className={team.team_name === highlightTeam ? "bg-blue-50" : "hover:bg-gray-50"}>
                                    <td>{team.position}</td><td className="font-semibold">{team.team_name}</td><td>{team.games_played}</td><td className="font-bold">{team.points}</td><td>{team.wins}</td><td>{team.draws}</td><td>{team.losses}</td><td>{team.goal_diff > 0 ? "+" : ""}{team.goal_diff}</td>
                                </tr>)}</tbody>
                            </table></div>
                            {pool.teams.length === 0 && <p className="p-4">No standings published yet.</p>}
                        </div>
                    )}
                </div>
            )}
            
        </div>
    )

}

export default Standings