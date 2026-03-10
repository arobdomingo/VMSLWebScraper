import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { apiGet } from "../api/client"
import type { MatchSummary, TeamScheduleResponse } from "../types/schedule"

function territoryText(isHome: boolean){
    return isHome ? "Home" : "Away"
}

function scoreText(match: MatchSummary){
    if(match.goals_for == null || match.goals_against == null) return "-"
    return `${match.goals_for}-${match.goals_against}`
}

function Schedule() {

    const { year, division, teamSlug } = useParams()

    const [data, setData] = useState<TeamScheduleResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const played = useMemo(() => data?.played.reverse() ?? [], [data])
    const upcoming = useMemo(() => data?.upcoming ?? [], [data])
    //only recomputes played/upcoming when data (team) changes

    useEffect(() => {

        setLoading(true)
        setError(null)

        apiGet<TeamScheduleResponse>(`/teams/${division}/${teamSlug}/schedule?year=${year}`)
            .then(setData)
            .catch((e) => setError(e.message ?? String(e)))
            .finally(() => setLoading(false))
    }, [year, division, teamSlug])

    return(
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Schedule</h1>
                <Link to={`/team/${year}/${division}/${teamSlug}`} className="text-sm text-blue-600 hover:underline">
                    Back to Team Hub
                </Link>
            </div>

            {data && (
                <div className="rounded-lg border bg-white p-4 text-sm">
                    <div><span className="font-medium">Team: </span> {data.team_name}</div>
                    <div><span className="font-medium">Year: </span> {data.year} • <span className="font-medium">Division: </span> {data.division}</div>
                </div>
            )}

            {loading && <div className="rounded-lg border bg-white p-4">Loading schedule...</div>}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="font-medium">Request failed</div>
                    <div className="mt-1 text-sm">{error}</div>
                </div>
            )}

            {data && (
                <>
                    {/*Upcoming*/}
                    <div className="rounded-lg border bg-white p-6">
                        <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
                        {upcoming.length === 0 ? (
                            <div className="text-sm text-gray-600">No upcoming fixtures.</div>
                        ): (
                            <div className="space-y-2">
                                {upcoming.map((match,idx) => (
                                   <div key={idx} className="rounded-md border px-4 py-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="text-gray-8000">
                                                <span className="font-sm">
                                                    {match.is_home ? "vs" : "@"} {match.opponent}
                                                </span>
                                                <span className="text-gray-500"> • {territoryText(match.is_home)}</span>
                                            </div>
                                            <div className="font-semibold">{match.date}</div>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {match.field ?? "Field TBD"}
                                        </div>
                                   </div> 
                                ))}
                            </div>
                        )}
                    </div>

                    {/*Played*/}
                    <div className="rounded-lg border bg-white p-6">
                        <h2 className="text-lg font-semibold mb-4">Played</h2>
                        {played.length === 0 ? (
                            <div className="text-sm text-gray-600">No played matches yet.</div>
                        ): (
                            <div className="space-y-2">
                                {played.map((match, idx) => (
                                   <div key={idx} className="rounded-md border px-4 py-3">

                                        <div className="text-xs text-gray-500">
                                            {match.date}
                                        </div>

                                        <div className="flex items-center justify-between text-sm">

                                            <div className="text-gray-8000">
                                                <span className="font-sm">
                                                    {match.is_home ? "vs" : "@"} {match.opponent}
                                                </span>
                                                <span className="text-gray-500"> • {territoryText(match.is_home)}</span>
                                            </div>

                                            <div className="font-semibold">
                                                {scoreText(match)}{" "}
                                                <span className="text-gray-500 font-normal">{match.result}</span>
                                            </div>

                                        </div>

                                        <div className="mt-1 text-xs text-gray-500">
                                            {match.field ?? "Field TBD"}
                                        </div>
                                   </div> 
                                ))}
                            </div>
                        )}
                    </div>

                </>
            )}

        </div>
    )

}
export default Schedule