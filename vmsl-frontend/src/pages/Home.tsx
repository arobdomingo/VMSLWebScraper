import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client";
import type { Division, DivisionsResponse } from "../types/division";
import type { Team, TeamsResponse } from "../types/teams";


function Home(){

    const navigate = useNavigate()

    const [year, setYear] = useState("2026")

    const [divisionsData, setDivisionsData] = useState<DivisionsResponse | null>(null)
    const [divisionsLoading, setDivisionLoading] = useState(false)
    const [divisionsError, setDivisionsError] = useState<string | null>(null)

    const [selectedDivision, setSelectedDivision] = useState("")
    const [selectedTeam, setSelectedTeam] = useState("")

    const [teams, setTeams] = useState<Team[]>()
    const [teamsLoading, setTeamsLoading] = useState(false)
    const [teamsError, setTeamsError] = useState<string | null>(null)

    useEffect(() => {
        setDivisionLoading(true)
        setDivisionsError(null)

        apiGet<DivisionsResponse>(`/divisions/grouped?year=${year}`)
            .then((res) => {
                setDivisionsData(res)
            })
            .catch((e) => setDivisionsError(e.message ?? String(e)))
            .finally(() => setDivisionLoading(false))
    }, [year])

    useEffect(() => {
        if (!selectedDivision) {
            setTeams([])
            setSelectedTeam("")
            return
        }

        setTeamsLoading(true)
        setTeamsError(null)
        setSelectedTeam("")

        apiGet<TeamsResponse>(`/divisions/${selectedDivision}/teams?year=${year}`)
            .then((res) => {
                setTeams(res.teams)
            })
            .catch((e) => setTeamsError(e.message ?? String(e)))
            .finally(() => setTeamsLoading(false))

    }, [selectedDivision, year])

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
            <div>
                <h1 className="text-4xl font-semibold leading-tight">Find your team</h1>
                <p className="mt-2 text-gray-600">
                    Select a season, division, and team to open the Team Hub.
                </p>
            </div>

            <div className="rounded-lg border bg-white p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Year
                        </label>
                        <input 
                            type="number"
                            value={year}
                            onChange = {(e) => setYear(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Division
                        </label>
                        <select
                            value = {selectedDivision}
                            onChange={(e) => setSelectedDivision(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                            disabled={divisionsLoading || !!divisionsError}
                        >
                            <option value="">Select Division</option>
                            {flatDivisions.map((division) => (
                                <option key={division.code} value={division.code}>
                                    {division.category_name} • {division.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team
                    </label>
                    <select
                        value={selectedTeam}
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
                    <div className="text-sm text-gray-600">Loading divisiosn...</div>
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

/*

function Home(){
    const navigate = useNavigate(); //changes the url programatically

    const goToSample = () => {
        //navigate("/team/2026/1/bby-selects-w-eagles");
        //navigate("/team/2026/3/east-van-fc");
        navigate("/team/2026/1/bct-rovers-hurricanes-a");
    };

    return(
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Find your team</h1>
            <p className="text-gray-600">
                This will become the Year - Division - Team Picker
            </p>

            <button onClick={goToSample} className="rounded-lg bg-black px-4 py-2 text-white">
                Go to sample team hub
            </button>
        </div>
    )
}

*/

export default Home;
