import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import type { DivisionsResponse } from "../types/division";
import type { TeamsResponse } from "../types/teams";


function Home(){

    const navigate = useNavigate()

    const [year, setYear] = useState(String(new Date().getMonth() >= 7 ? new Date().getFullYear() + 1 : new Date().getFullYear()))

    const [selectedDivision, setSelectedDivision] = useState("");
    const [selectedTeam, setSelectedTeam] = useState("");
    const validYear = /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 2100;
    const {data: divisionsData, loading: divisionsLoading, error: divisionsError} = useApi<DivisionsResponse>(validYear ? `/divisions/grouped?year=${year}` : null);
    const {data: teamsData, loading: teamsLoading, error: teamsError} = useApi<TeamsResponse>(validYear && selectedDivision ? `/divisions/${selectedDivision}/teams?year=${year}` : null);
    const teams = teamsData?.teams;

    const flatDivisions = useMemo(() => {
        if(!divisionsData) return []
        return divisionsData.categories.flatMap((category) =>
            category.divisions.map((division) => ({
                ...division,
                category_name: category.category_name
            })) 
        )
    }, [divisionsData])

    const selectedTeamObj = teams?.find((team) => team.team_slug === selectedTeam)

    function handleGoToTeamHub() {
        if(!selectedDivision || !selectedTeam) return
        navigate(`/team/${year}/${selectedDivision}/${selectedTeam}`)
    }

    return (
        <div className = "space-y-6">
            <div className="hero"><div>
                <div className="eyebrow mb-4">Vancouver Metro Soccer League</div>
                <h1 className="text-4xl font-semibold leading-tight">Your club. Every angle.</h1>
                <p className="mt-2 text-gray-600">
                    Explore the table, follow your form, and discover the numbers behind your season.
                </p>
            </div><aside className="pitch"><div className="text-xs uppercase tracking-widest text-emerald-300">The local game, in focus</div><div className="mt-4 text-2xl font-semibold">From the touchline<br/>to the table.</div><p className="mt-3 text-sm">Standings · Fixtures · Player leaders</p></aside></div>

            <div className="rounded-lg border bg-white p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                            Season ending year
                        </label>
                        <input 
                            id="season" min="1900" max="2100" type="number"
                            value={year}
                            onChange = {(e) => { setYear(e.target.value); setSelectedDivision(""); setSelectedTeam(""); }}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-2">
                            Division
                        </label>
                        <select
                            id="division" value = {selectedDivision}
                            onChange={(e) => { setSelectedDivision(e.target.value); setSelectedTeam(""); }}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            disabled={divisionsLoading || !!divisionsError}
                        >
                            <option value="">Select division</option>
                            {flatDivisions.map((division) => (
                                <option key={division.code} value={division.code}>
                                    {division.category_name} • {division.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                        Team
                    </label>
                    <select
                        id="team" value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        disabled={!selectedDivision || teamsLoading || !!teamsError}
                    >
                        <option value="">Select team</option>
                        {teams?.map((team) => (
                            <option key={team.team_slug} value={team.team_slug}>
                                {team.team_name}
                                {team.pool_name ? ` (${team.pool_name})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
                
                {divisionsLoading && (
                    <div className="text-sm text-gray-600">Loading divisions...</div>
                )}

                {divisionsError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        Failed to load divisions: {divisionsError}
                    </div>
                )}

                {teamsLoading && selectedDivision && (
                    <div className="text-sm text-gray-600">Loading teams...</div>
                )}

                {teamsError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        Failed to load teams: {teamsError}
                    </div>
                )}

                {selectedTeamObj && (
                    <div className="rounded-md border bg-gray-50 p-4 text-sm">
                        <div className="font-medium">{selectedTeamObj.team_name}</div>
                        <div className="text-gray-600 mt-1">
                            Division {selectedDivision}{selectedTeamObj.pool_name ? ` • ${selectedTeamObj.pool_name}` : ""}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleGoToTeamHub}
                    disabled={!selectedDivision || !selectedTeam}
                    className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Go to Team Hub
                </button>
            
            </div>
        
        </div>
    )
}


export default Home;
