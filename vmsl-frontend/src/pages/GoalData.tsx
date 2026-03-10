import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiGet } from "../api/client";
import type { GoalDataResponse, TeamGoalData, MatchSummary } from "../types/goalData";

type Metric = "gf" | "ga" | "gd";

function formatHomeAway(isHome: boolean) {
    return isHome ? "Home" : "Away";
}

function formatScore(ms: MatchSummary) {
    const gf = ms.goals_for ?? "-";
    const ga = ms.goals_against ?? "-";
    return `${gf}-${ga}`;
}

function GoalData() {
    const { year, division, teamSlug } = useParams();

    const location = useLocation();
    const selectedTeam = (location.state as any)?.selectedTeam as string | undefined;
  
    const [data, setData] = useState<GoalDataResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const [metric, setMetric] = useState<Metric>("gf");

    
    useEffect(() => {
        setLoading(true);
        setError(null);

        apiGet<GoalDataResponse>(`/divisions/${year}/${division}/goal-data?team_slug=${teamSlug}`)
            .then(setData)
            .catch((e) => setError(e.message ?? String(e)))
            .finally(() => setLoading(false));
    }, [year, division, teamSlug]);

    const selectedRow: TeamGoalData | null = useMemo(() => {
        return data?.teams.find((team) => team.team_slug === teamSlug) ?? null;
    }, [data, teamSlug]);

    //rank the teams as per a given metric
    const ranked = useMemo(() => {
        if (!data) return [];
    
        const arr = [...data.teams];
    
        if (metric === "gf") arr.sort((a, b) => b.goals_for - a.goals_for);
        if (metric === "ga") arr.sort((a, b) => a.goals_against - b.goals_against);
        if (metric === "gd") arr.sort((a, b) => b.goal_diff - a.goal_diff);
    
        return arr;
    }, [data, metric]);

    //define a rankMap given the rank
    const rankMap = useMemo(() => {
        const map = new Map<string, number>();
        ranked.forEach((team, index) => map.set(team.team_slug, index+ 1));
        return map;
    }, [ranked]);

    //rank of selected team
    const selectedRank = selectedRow ? rankMap.get(selectedRow.team_slug) : null;

    const metricLabel = metric === "gf" ? "Goals For" : metric === "ga" ? "Goals Against" : "Goal Difference";
    const metricShort = metric === "gf" ? "GF" : metric === "ga" ? "GA" : "GD";

    return(
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Goal Data Dashboard</h1>
                <div className="text-sm text-gray-600">
                    {year} • Division {division}
                    {selectedTeam ? ` • ${selectedTeam}` : ""}
                </div>

                {year && division && teamSlug && (
                    <Link
                        to={`/team/${year}/${division}/${teamSlug}`}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Back to Team hub
                    </Link>
                )}
            </div>

            {loading && (
                <div className="rounded-lg border bg-white p-4">Loading goal data...</div>
            )}

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    {error}
                </div>
            )}

            {data && selectedRow && (
                <>
                    {/* Snapshot Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-gray-500">Goals For</div>
                            <div className="mt-1 text-2xl font-bold tabular-nums">{selectedRow.goals_for}</div>
                            <div className="mt-1 text-sm text-gray-600 tabular-nums">
                                {selectedRow.gf_per_game.toFixed(2)} / game
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-gray-500">Goals Against</div>
                            <div className="mt-1 text-2xl font-bold tabular-nums">{selectedRow.goals_against}</div>
                            <div className="mt-1 text-sm text-gray-600 tabular-nums">
                                {selectedRow.ga_per_game.toFixed(2)} / game
                            </div>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <div className="text-sm text-gray-500">Goals Difference</div>
                            <div className="mt-1 text-2xl font-bold tabular-nums">{selectedRow.goal_diff}</div>
                            <div className="mt-1 text-sm text-gray-600 tabular-nums">
                                {selectedRow.gd_per_game.toFixed(2)} / game
                            </div>
                        </div>
                    </div>

                    {/* Rankings Module */}
                    <div className="rounded-lg border bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold">{metricLabel} Rankings</h2>
                            {selectedRank && (
                                <div className="text-sm text-gray-600">
                                    Your rank: <span className="font-semibold tabular-nums">#{selectedRank}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex rounded-md border bg-gray-50 p-1 text-sm">
                            <button
                                className={`px-3 py-1 rounded ${metric === "gf" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
                                onClick={() => setMetric("gf")}
                            >
                                GF
                            </button>

                            <button
                                className={`px-3 py-1 rounded ${metric === "ga" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
                                onClick={() => setMetric("ga")}
                            >
                                GA
                            </button>

                            <button
                                className={`px-3 py-1 rounded ${metric === "gd" ? "bg-white shadow-sm font-medium" : "text-gray-600"}`}
                                onClick={() => setMetric("gd")}
                            >
                                GD
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg border">
                        <div className="grid grid-cols-12 border-b px-4 py-2 text-xs font-semibold text-gray-500">
                            <div className="col-span-2">Rank</div>
                            <div className="col-span-6">Team</div>
                            <div className="col-span-2">GP</div>
                            <div className="col-span-2">{metricShort}</div>
                        </div>

                        <div className="divide-y">
                            {ranked.map((team) => {
                                const isHighlighted = team.team_slug === teamSlug
                                const rank = rankMap.get(team.team_slug)

                                const value = metric === "gf" ? team.goals_for : metric === "ga" ? team.goals_against: team.goal_diff

                                return(
                                    <div
                                        key={team.team_slug}
                                        className={`grid grid-cols-12 px-4 py-3 text-sm ${isHighlighted ? "bg-blue-50" : ""}`}
                                    >
                                        <div className="col-span-2 text-gray-600 tabular-nums">
                                            {rank ?? "-"}
                                        </div>

                                        <div className="col-span-6 min-w-0">
                                            <div className={`truncate ${isHighlighted ? "font-semibold" : "font-medium"}`}>
                                                {team.team_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {team.gf_per_game.toFixed(2)} GF/g • {team.ga_per_game.toFixed(2)} GA/g
                                            </div>
                                        </div>

                                        <div className="col-span-2 tabular-nums text-gray-700">
                                            {team.games_played}
                                        </div>

                                        <div className="col-span-2 font-semibold tabular-nums">
                                            {value}
                                        </div>
                                    </div>
                                )

                            })}
                        </div>
                    </div>

                    {/* Insights + Trend */}
                    {data.insights && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Insights */}
                            <div></div>
                        </div>
                    )}
                </>
            )}

            
        </div>
    )
}

export default GoalData