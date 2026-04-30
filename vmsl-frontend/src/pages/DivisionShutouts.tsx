import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiGet } from "../api/client";
import type { ShutoutsResponse } from "../types/shutouts";

function DivisionShutouts() {
  const { year, division, teamSlug } = useParams();

  const [data, setData] = useState<ShutoutsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!year || !division) return;

    setLoading(true);
    setError(null);

    apiGet<ShutoutsResponse>(`/divisions/${year}/${division}/shutouts`)
      .then(setData)
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setLoading(false));
  }, [year, division]);

  const allKeepers = useMemo(() => {
    return data?.pools.flatMap((p) => p.keepers) ?? [];
  }, [data]);

  const leagueRank = useMemo(() => {
    const map = new Map<string, number>();
    allKeepers.forEach((k, index) => {
      const key = `${k.player_name}_${k.team_name}`;
      if (!map.has(key)) map.set(key, index + 1);
    });
    return map;
  }, [allKeepers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allKeepers;

    return allKeepers.filter(
      (keeper) =>
        keeper.player_name.toLowerCase().includes(q) ||
        keeper.team_name.toLowerCase().includes(q)
    );
  }, [allKeepers, query]);

  const location = useLocation();
  const selectedTeam = (location.state as any)?.selectedTeam as string | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Division Keeper Shutouts</h1>

        {year && division && teamSlug && (
          <Link
            to={`/team/${year}/${division}/${teamSlug}`}
            className="text-sm text-blue-600 hover:underline"
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
          placeholder="Search keeper or team..."
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {loading && (
        <div className="rounded-lg border bg-white p-4">
          Loading division shutouts...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {data && (
        <div className="rounded-lg border bg-white">
          <div className="grid grid-cols-12 border-b px-4 py-2 text-xs font-semibold text-gray-500">
            <div className="col-span-2">Rank</div>
            <div className="col-span-7">Keeper</div>
            <div className="col-span-3 text-right">Shutouts</div>
          </div>

          <div className="divide-y">
            {filtered.map((keeper, idx) => {
              const isHighlighted = keeper.team_name === selectedTeam;

              return (
                <div
                  key={`${keeper.player_name}-${keeper.team_name}-${idx}`}
                  className={`grid grid-cols-12 px-4 py-3 text-sm ${isHighlighted ? "bg-blue-50" : ""}`}
                >
                  <div className="col-span-2 text-gray-600 tabular-nums">
                    {leagueRank.get(`${keeper.player_name}_${keeper.team_name}`) ?? "-"}
                  </div>

                  <div className="col-span-7 min-w-0">
                    <div className={`truncate ${isHighlighted ? "font-semibold" : "font-medium"}`}>
                      {keeper.player_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{keeper.team_name}</div>
                  </div>

                  <div className="col-span-3 text-right font-semibold tabular-nums">
                    {keeper.shutouts}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DivisionShutouts;