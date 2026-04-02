import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiGet } from "../api/client";
import type { MvpRow, MvpsResponse } from "../types/mvps";

function DivisionMvps() {

const { year, division, teamSlug } = useParams();

  const [data, setData] = useState<MvpsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiGet<MvpsResponse>(`/divisions/${year}/${division}/mvps`)
      .then(setData)
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [year, division]);
  
  const allMvps = useMemo(() => {
    return data?.pools.flatMap((pool) => pool.player_mvps) ?? []
  }, [data])

  const leagueRank = useMemo(() => {
    const map = new Map<string, number>()
    allMvps.forEach((p, index) => {
      const key = `${p.player_name}_${p.team_name}`
      if (!map.has(key)) map.set(key, index + 1)
    });
    return map;
  }, [allMvps])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allMvps
    return allMvps.filter(
      (p) =>
        p.player_name.toLowerCase().includes(q) ||
        p.team_name.toLowerCase().includes(q)
    )
  }, [allMvps, query])

  const location = useLocation()
  const selectedTeam = (location.state as any)?.selectedTeam as string | undefined

  return(
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold">Division MVPs</h1>

        {year && division && teamSlug && (
          <Link
            to={`/team/${year}/${division}/${teamSlug}`}
            className="text-sm text-blue-600 hover:underline md:shring--"
          >
            Back to Team Hub
          </Link>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm">
        <div><span className="font-medium">Year:</span> {year}</div>
        <div><span className="font-medium">Division:</span> {division}</div>
        {selectedTeam && (
          <div><span className="font-medium">Team:</span> {selectedTeam}</div>
        )}
      </div>

      <div className="rounded-lg border bg-white p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search player or team..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {loading && <div className="rounded-lg border bg-white p-4">Loading division MVPs...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

      {data && (
        <div className="rounded-lg border bg-white">
          <div className="grid grid-cols-12 border-b px-4 py-2 text-xs font-semibold text-gray-500">
            <div className="col-span-2">Rank</div>
            <div className="col-span-7">Player</div>
            <div className="col-span-3">MVPs</div>
          </div>

          <div className="divide-y">
            {filtered.map((p, idx) => {
              const isHighlighted = p.team_name === selectedTeam;

              return (
                <div
                  key={`${p.player_name}-${p.team_name}-${idx}`}
                  className={`grid grid-cols-12 px-4 py-3 text-sm ${isHighlighted ? "bg-blue-50" : ""}`}
                >
                  <div className="col-span-2 text-gray-600 tabular-nums">
                    {leagueRank.get(`${p.player_name}_${p.team_name}`) ?? "-"}
                  </div>

                  <div className="col-span-7 min-w-0">
                    <div className={`truncate ${isHighlighted ? "font-semibold" : "font-medium"}`}>
                      {p.player_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{p.team_name}</div>
                  </div>

                  <div className="col-span-3 font-semibold tabular-nums">
                    {p.mvps}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )

}

export default DivisionMvps