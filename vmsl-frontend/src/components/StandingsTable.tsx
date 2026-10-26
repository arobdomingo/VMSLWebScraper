import type { StandingsPool } from "../types/standings";

type StandingsTableProps = {
    pool: StandingsPool;
    year?: string;
    division?: string;
    highlightTeam?: string;
};

export default function StandingsTable({ pool, year, division, highlightTeam }: StandingsTableProps) {
    return <>
        <p className="text-xs text-gray-600 mb-3 md:hidden">Scroll the table horizontally to see all statistics.</p>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable division standings">
            <table>
                <caption className="sr-only">
                    Division {division} standings, season ending {year}, {pool.pool_name || "all teams"}
                </caption>
                <thead>
                    <tr>{["Pos", "Team", "GP", "Pts", "W", "D", "L", "GD"].map(label =>
                        <th scope="col" key={label}>{label}</th>
                    )}</tr>
                </thead>
                <tbody>{pool.teams.map(team =>
                    <tr key={team.team_name} className={team.team_name === highlightTeam ? "bg-blue-50" : "hover:bg-gray-50"}>
                        <td>{team.position}</td>
                        <th scope="row" className="team-name">{team.team_name}</th>
                        <td>{team.games_played}</td>
                        <td className="font-bold">{team.points}</td>
                        <td>{team.wins}</td>
                        <td>{team.draws}</td>
                        <td>{team.losses}</td>
                        <td>{team.goal_diff > 0 ? "+" : ""}{team.goal_diff}</td>
                    </tr>
                )}</tbody>
            </table>
        </div>
    </>;
}
