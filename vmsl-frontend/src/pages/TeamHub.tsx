import TeamAnalysis, { Difficulty } from "../components/TeamAnalysis";
import type { TeamAnalysis as Analysis } from "../types/analysis";
import { LoadingMessage, ErrorMessage } from "../components/RequestFeedback";
import { Link, useParams } from "react-router-dom"

import { useApi } from "../hooks/useApi"
import type { ScorersResponse } from "../types/scorers";
import type { MvpsResponse } from "../types/mvps";
import type { ShutoutsResponse } from "../types/shutouts";

interface TeamOverview {
    year: number
    division: string
    team_name: string
    team_slug: string

    standings: null | {
        position: number
        standing: {
            games_played: number
            wins: number
            draws: number
            losses: number
            goals_for: number
            goals_against: number
            goal_diff: number
            points: number
        }
        rivals_above: {
            team_name: string
            points: number
            goal_diff: number
            position: number
        }[]
    
        rivals_below: {
            team_name: string
            points: number
            goal_diff: number
            position: number
        }[]
    }

    form: {
        date: string
        opponent: string
        is_home: boolean
        result: string
        goals_for: number
        goals_against: number
    }[]

    upcoming_fixture: null | {
        date: string
        opponent: string
        is_home: boolean
        field: string
    }
}

function resultClasses(r: string) {
    if(r === 'W') return "border-green-300 bg-green-50 text-green-800";
    if(r === 'D') return "border-yellow-300 bg-yellow-50 text-yellow-800";
    if(r === 'L') return "border-red-300 bg-red-50 text-red-800";
    return "border-gray-300 bg-gray-50 text-gray-800";

}

function TeamHub(){

    const{ year, division, teamSlug } = useParams();

    const {data, loading, error} = useApi<TeamOverview>(`/teams/${division}/${teamSlug}/overview?year=${year}`);
    const {data: scorersData, error: scorersError} = useApi<ScorersResponse>(`/divisions/${year}/${division}/scorers`);
    const {data: mvpsData, error: mvpsError} = useApi<MvpsResponse>(`/divisions/${year}/${division}/mvps`);
    const {data: shutoutsData, error: shutoutsError} = useApi<ShutoutsResponse>(`/divisions/${year}/${division}/shutouts`);
    const analysis = useApi<Analysis>(`/teams/${division}/${teamSlug}/analysis?year=${year}`);
    const scorers = scorersData?.pools.flatMap(pool => pool.scorers);
    const mvps = mvpsData?.pools.flatMap(pool => pool.player_mvps);
    const shutouts = shutoutsData?.pools.flatMap(pool => pool.keepers);

    const teamGoals = data?.standings?.standing?.goals_for ?? 0;

    const teamTopScorers = scorers ?
        scorers
            .filter((scorer) => scorer.team_name === data?.team_name)
            .sort((playerA, playerB) => playerB.goals - playerA.goals)
            .slice(0,5)
        : []
    


    const teamTopMvps = mvps ?
        mvps
            .filter((player) => player.team_name === data?.team_name)
            .sort((playerA, playerB) => playerB.mvps - playerA.mvps)
            .slice(0, 5)
        : []



    const teamTopShutouts = shutouts ?
        shutouts
          .filter((k) => k.team_name === data?.team_name)
          .sort((a, b) => b.shutouts - a.shutouts)
          .slice(0, 5)
        : []
      
      const teamGamesPlayed = data?.standings?.standing?.games_played ?? 0

    return(

        <div className = "space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Team Hub</h1>
                <Link to="/" className="text-sm text-blue-600 hover:underline">Change team</Link>
            </div>

            <div className="rounded-lg border bg-white p-5">
                <div className="text-xl font-semibold">{data?.team_name}</div>
                <div className="mt-1 text-sm text-gray-600">
                    Division {division} • {year} season
                </div>
            </div>

            {loading && (
                <LoadingMessage>Loading overview...</LoadingMessage>
            )}

            {error && (
                <ErrorMessage message={error} />
            )}

            {data && !data.standings && <p className="rounded-lg border bg-white p-4">No standings published for this team yet.</p>}
            {data && data.standings && (
                <>

                    <div className="rounded-lg border bg-white p-6 space-y-6">
                        
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold">Standings</h2>
                            <Link 
                                to={`/divisions/${year}/${division}/standings`} 
                                state={{ highlightTeam: data.team_name }}
                                className="text-sm text-blue-600 hover:underline mb-2"
                            >
                                View Full Table
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-gray-500">Position</div>
                                <div className="text-2xl font-bold">{data.standings.position}</div>
                            </div>
                            <div>
                                    <div className="text-gray-500">Wins</div>
                                    <div className="text-2xl font-bold">{data.standings.standing.wins}</div>
                            </div>
                            <div>
                                    <div className="text-gray-500">Draws</div>
                                    <div className="text-2xl font-bold">{data.standings.standing.draws}</div>
                            </div>
                            <div>
                                <div className="text-gray-500">Losses</div>
                                <div className="text-2xl font-bold">{data.standings.standing.losses}</div>
                            </div>
                        </div>

                        <div>

                            <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 border-b pb-1">
                                <div className="col-span-2">Pos</div>
                                <div className="col-span-6">Team</div>
                                <div className="col-span-2">Pts</div>
                                <div className="col-span-2">GD</div>
                            </div>

                            <div className="mt-2">
                                <div className="space-y-2">
                                    {data.standings.rivals_above.map((rival, idx) => (
                                        <div key={idx} className="grid grid-cols-12 text-sm">
                                            <div className="col-span-2 font-medium">{rival.position}</div>
                                            <div className="col-span-6 font-medium">{rival.team_name}</div>
                                            <div className="col-span-2 font-medium">{rival.points}</div>
                                            <div className="col-span-2 font-medium">{rival.goal_diff}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-1 rounded-md border bg-blue-50 py-2">
                                <div className="grid grid-cols-12 text-sm items-center">
                                    <div className="col-span-2 font-medium">{data.standings.position}</div>
                                    <div className="col-span-6 font-medium">{data.team_name}</div>
                                    <div className="col-span-2 font-medium">{data.standings.standing.points}</div>
                                    <div className="col-span-2 font-medium">{data.standings.standing.goal_diff}</div>
                                </div>
                            </div>

                            <div className="mt-1">
                                <div className="space-y-2">
                                    {data.standings.rivals_below.map((rival, idx) => (
                                        <div key={idx} className="grid grid-cols-12 text-sm">
                                            <div className="col-span-2 font-medium">{rival.position}</div>
                                            <div className="col-span-6 font-medium">{rival.team_name}</div>
                                            <div className="col-span-2 font-medium">{rival.points}</div>
                                            <div className="col-span-2 font-medium">{rival.goal_diff}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                    {/**/}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            
                            <div className="rounded-lg border bg-white p-6">
                                <h2 className="text-xl font-semibold text-center">Upcoming Fixture</h2>
                                <Link
                                    to={`/team/${year}/${division}/${teamSlug}/schedule`}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View Full Schedule
                                </Link>

                                {data.upcoming_fixture && <Difficulty data={analysis.data} />}
                                {data.upcoming_fixture ? (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-500">Date</div>
                                            <div className="text-lg font-semibold">{data.upcoming_fixture.date}</div>
                                        </div>

                                        <div>
                                            <div className="text-gray-500">Territory</div>
                                            <div className="text-lg font-semibold">
                                                {data.upcoming_fixture.is_home ? "Home" : "Away"}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <div className="text-gray-500">Opponent</div>
                                            <div className="text-lg font-semibold">{data.upcoming_fixture.opponent}</div>
                                        </div>

                                        <div className="col-span-2">
                                            <div className="text-gray-500">Field</div>
                                            <div className="text-base font-medium">{data.upcoming_fixture.field ?? "TBD"}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-gray-600">
                                        No remaining fixtures.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border bg-white p-6">
                                <h2 className="text-xl font-semibold text-center mb-6">Recent Form</h2>

                                {data.form.length === 0 && <p className="text-sm text-gray-600">No completed matches yet.</p>}
                                <div className="flex justify-center gap-2 mb-6">
                                    {data.form.slice(0, 5).map((match, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${resultClasses(match.result)}`} 
                                            title={`${match.opponent} • ${match.goals_for}-${match.goals_against} • ${match.date}`}
                                        >
                                            {match.result}
                                        </span>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {data.form.slice(0, 5).map((match, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="text-gray-700">
                                                <span className="font-medium">{match.opponent}</span>
                                                <span className="text-gray-500"> • {match.is_home ? "Home" : "Away"} • </span>
                                            </div>
                                            <div className="font-semibold">
                                                {match.goals_for}-{match.goals_against} <span className="text-gray-500 font-normal">({match.result})</span>
                                            </div>
                                    </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">Top Scorers</h2>

                                    <Link 
                                        to={`/team/${year}/${division}/${teamSlug}/scorers`}
                                        state={ { selectedTeam: data.team_name } }
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View division list
                                    </Link>
                                </div>

                                {scorersError && (
                                    <div className="text-sm text-red-700">
                                        Failed to load scorers; {scorersError}
                                    </div>
                                )}

                                {!scorers && !scorersError && (
                                    <div className="text-sm text-gray-600">Loading scorers...</div>
                                )}

                                {scorers && teamTopScorers.length === 0  && (
                                    <div className="text-sm text-gray-600">No goal scorers found for this team.</div>
                                )}
        
                                {scorers && teamTopScorers.length > 0  && (
                                    <div className="divide-y">
                                        {teamTopScorers.map((player, idx) => {
                                            const percentage = teamGoals > 0 ? Math.round((player.goals / teamGoals) * 100) : null;

                                            return(
                                                <div key={idx} className="py-3 grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                                                    <div className="min-w-0 flex flex-col gap-0.5">
                                                        <div className="font-medium leading-tight truncate">{player.player_name}</div>

                                                        <div className="text-xs text-gray-500 leading-tight">
                                                            {percentage == null ? "-" : `${percentage}% of team goals`}
                                                        </div>

                                                    </div>
                                                    <div className="font-semibold tabular-nums min-w-[2ch]">{player.goals}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className="space-y-6">

                            <div className="rounded-lg border bg-white p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">Goal Data</h2>

                                    <Link
                                        to={`/team/${year}/${division}/${teamSlug}/goals`}
                                        state= {{ selectedTeam: data.team_name}}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                            View Goal Data
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="rounded-md border bg-gray-50 p-4">
                                        <div className="text-sm text-gray-500">Goals For</div>
                                        <div className="mt-1 text-2xl font-bold tabular-nums">
                                            {data.standings.standing.goals_for}
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600 tabular-nums">
                                            {(data.standings.standing.games_played > 0 ? (data.standings.standing.goals_for / data.standings.standing.games_played).toFixed(2) : "—")} / game
                                        </div>
                                    </div>

                                    <div className="rounded-md border bg-gray-50 p-4">
                                        <div className="text-sm text-gray-500">Goals Against</div>
                                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                                {data.standings.standing.goals_against}
                                            </div>
                                            <div className="mt-1 text-sm text0gray-600 tabular-nums">
                                                {(data.standings.standing.games_played > 0 ? (data.standings.standing.goals_against / data.standings.standing.games_played).toFixed(2) : "—")} / game
                                        </div>
                                    </div>

                                    <div className="rounded-md border bg-gray-50 p-4">
                                        <div className="text-sm text-gray-500">Goals Difference</div>
                                            <div className="mt-1 text-2xl font-bold tabular-nums">
                                                {data.standings.standing.goal_diff}
                                            </div>
                                            <div className="mt-1 text-sm text0gray-600 tabular-nums">
                                                {(data.standings.standing.games_played > 0 ? (data.standings.standing.goal_diff / data.standings.standing.games_played).toFixed(2) : "—")} / game
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">MVPs</h2>

                                    <Link
                                        to={`/team/${year}/${division}/${teamSlug}/mvps`}
                                        state={{ selectedTeam: data.team_name }}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View division list
                                    </Link>
                                </div>

                                {mvpsError && (
                                    <div className="text-sm text-red-700">
                                        Failed to load MVPs: {mvpsError}
                                    </div>
                                )}

                                {!mvps && !mvpsError && (
                                    <div className="text-sm text-agry-600">Loading MVPs...</div>
                                )}

                                {mvps && teamTopMvps.length === 0 && (
                                    <div className="text-sm text-gray-600">No MVPs found for this team.</div>
                                )}

                                {mvps && teamTopMvps.length > 0 && (
                                    <div className="divide-y">
                                        {teamTopMvps.map((player, idx) => {
                                            const percentage = teamGamesPlayed > 0 ? Math.round((player.mvps / teamGamesPlayed) * 100) : null
                                            
                                            return(
                                                <div 
                                                    key={`${player.player_name}-${player.team_name}-${idx}`}
                                                    className="py-3 grid grid-cols-[1fr_auto] items-center gap-3 text-sm" 
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-medium leading-tight truncate">{player.player_name}</div>
                                                        <div className="text-xs text-gray-500 leading-tight">{percentage == null ? "-" : `${percentage}% of games`}</div>
                                                    </div>
                                                    <div className="font-semibold tabular-nums min-w-[2ch]">{player.mvps}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border bg-white p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">Keeper Shutouts</h2>

                                    <Link
                                    to={`/team/${year}/${division}/${teamSlug}/shutouts`}
                                    state={{ selectedTeam: data.team_name }}
                                    className="text-sm text-blue-600 hover:underline"
                                    >
                                    View division list
                                    </Link>
                                </div>

                                {shutoutsError && (
                                    <div className="text-sm text-red-700">
                                    Failed to load shutouts: {shutoutsError}
                                    </div>
                                )}

                                {!shutouts && !shutoutsError && (
                                    <div className="text-sm text-gray-600">Loading shutouts...</div>
                                )}

                                {shutouts && teamTopShutouts.length === 0 && (
                                    <div className="text-sm text-gray-600">No shutouts found for this team.</div>
                                )}

                                {shutouts && teamTopShutouts.length > 0 && (
                                    <div className="divide-y">
                                    {teamTopShutouts.map((k, idx) => {
                                        const pct = teamGamesPlayed > 0 ? Math.round((k.shutouts / teamGamesPlayed) * 100) : null;

                                        return (
                                        <div
                                            key={`${k.player_name}-${k.team_name}-${idx}`}
                                            className="py-3 grid grid-cols-[1fr_auto] items-center gap-3 text-sm"
                                        >
                                            <div className="min-w-0">
                                            <div className="font-medium leading-tight truncate">{k.player_name}</div>
                                            <div className="text-xs text-gray-500 leading-tight">
                                                {pct == null ? "-" : `${pct}% of games`}
                                            </div>
                                            </div>
                                            <div className="font-semibold tabular-nums min-w-[2ch]">{k.shutouts}</div>
                                        </div>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/**/}
                        
                </>
            )} 

            {data && <TeamAnalysis year={year!} division={division!} teamSlug={teamSlug!} data={analysis.data} loading={analysis.loading} error={analysis.error} />}
        </div>

    )

}

export default TeamHub
