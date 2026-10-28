"""Pure team-perspective calculations, independent of HTTP and storage."""

from . import models


def build_match_summary(row, team_name) -> models.MatchSummary:

    home = row["hometeam"]
    away = row["awayteam"]
    is_home = home == team_name
    opponent = away if is_home else home

    hg = row.get("homeresult")
    ag = row.get("awayresult")

    goals_for = hg if is_home else ag
    goals_against = ag if is_home else hg

    result = None
    if goals_for is not None and goals_against is not None:
        if goals_for > goals_against:
            result = "W"
        elif goals_for < goals_against:
            result = "L"
        else:
            result = "D"

    d = row["date"]
    date_str = d.isoformat() if hasattr(d, "isoformat") else str(d)

    return models.MatchSummary(
        date=date_str,
        opponent=opponent,
        is_home=is_home,
        goals_for=goals_for,
        goals_against=goals_against,
        result=result,
        field=row.get("field") or None,
    )


def completed(row):
    return row.get("homeresult") is not None and row.get("awayresult") is not None


def venue_split(fixtures, team_name, is_home):
    matches = [
        build_match_summary(r, team_name)
        for r in fixtures
        if completed(r)
        and (r["hometeam"] == team_name if is_home else r["awayteam"] == team_name)
    ]
    n = len(matches)
    wins = sum(m.result == "W" for m in matches)
    draws = sum(m.result == "D" for m in matches)
    gf = sum(m.goals_for for m in matches)
    ga = sum(m.goals_against for m in matches)
    return models.VenueSplit(
        games_played=n,
        wins=wins,
        draws=draws,
        losses=n - wins - draws,
        goals_for=gf,
        goals_against=ga,
        clean_sheets=sum(m.goals_against == 0 for m in matches),
        points_per_game=(3 * wins + draws) / n if n else None,
        gf_per_game=gf / n if n else None,
        ga_per_game=ga / n if n else None,
    )


def comparison(row, pool_name, fixtures, slug):
    gp = row["gp"]
    played = sorted(
        (
            r
            for r in fixtures
            if completed(r) and row["team"] in (r["hometeam"], r["awayteam"])
        ),
        key=lambda r: r["date"],
    )
    return models.TeamComparison(
        team_name=row["team"],
        team_slug=slug,
        pool_name=pool_name,
        position=row["position"],
        points_per_game=row["pts"] / gp if gp else None,
        gf_per_game=row["gf"] / gp if gp else None,
        ga_per_game=row["ga"] / gp if gp else None,
        form=[build_match_summary(r, row["team"]) for r in played[-5:]],
    )


def fixture_difficulty(team_name, opponent_name, pools):
    # Compare only within the team's pool; other pools are not directly comparable.
    pool = next((p for p in pools if any(r["team"] == team_name for r in p)), [])
    opponent = next((r for r in pool if r["team"] == opponent_name), None)
    if opponent is None or opponent["gp"] <= 0:
        return models.FixtureDifficulty(label="Unavailable")
    ppg = opponent["pts"] / opponent["gp"]
    # Fixed transparent thresholds, independent of pool size and tie ordering.
    label = "High" if ppg >= 2 else "Medium" if ppg >= 1 else "Low"
    return models.FixtureDifficulty(
        label=label, opponent_ppg=ppg, opponent_games=opponent["gp"]
    )
