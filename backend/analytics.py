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
