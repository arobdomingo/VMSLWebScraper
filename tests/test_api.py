from datetime import date
from fastapi.testclient import TestClient
from backend import main, scraper, transport
from backend.analytics import build_match_summary
import httpx
import pytest

client = TestClient(main.app)


def row(i):
    return dict(
        position=i, team=f"Team {i}", gp=2, w=1, d=0, l=1, gf=3, ga=2, gd=1, pts=3
    )


def test_health_and_validation():
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/divisions/nope/1/standings").status_code == 422
    assert client.get("/divisions/1800/1/standings").status_code == 422


@pytest.mark.parametrize("position", range(1, 8))
def test_rival_window_at_every_position(monkeypatch, position):
    monkeypatch.setattr(
        main, "parse_standings", lambda *_: [[row(i) for i in range(1, 8)]]
    )
    context, _ = main.build_standings_context(2026, "1", f"Team {position}")
    rivals = context.rivals_above + context.rivals_below
    assert len(rivals) == 4
    assert all(r.position != position for r in rivals)
    assert all(r.position < position for r in context.rivals_above)
    assert all(r.position > position for r in context.rivals_below)


def test_upstream_failure_is_safe(monkeypatch):
    def fail(*_):
        raise transport.UpstreamError("private implementation details")

    monkeypatch.setattr(main, "parse_standings", fail)
    response = client.get("/divisions/2026/1/standings")
    assert response.status_code == 502
    assert "private" not in response.text


def test_standings_contract_without_database(monkeypatch):
    monkeypatch.setattr(main, "parse_standings", lambda *_: [[row(1)]])
    response = client.get("/divisions/2026/1/standings")
    assert response.status_code == 200
    assert response.json()["pools"][0]["teams"][0]["team_name"] == "Team 1"


@pytest.mark.parametrize(
    "home,away,expected", [(3, 1, "L"), (0, 0, "D"), (None, None, None)]
)
def test_away_perspective(home, away, expected):
    match = build_match_summary(
        dict(
            hometeam="A",
            awayteam="B",
            homeresult=home,
            awayresult=away,
            date=date(2026, 1, 1),
        ),
        "B",
    )
    assert match.result == expected
    assert match.goals_for == away
    assert match.date == "2026-01-01"


def test_standings_html(monkeypatch):
    html = (
        "<table><tr>"
        + "".join(
            f"<th>{h}</th>"
            for h in ["Pos", "Team", "GP", "W", "D", "L", "GF", "GA", "GD", "Pts"]
        )
        + "</tr><tr>"
        + "".join(f"<td>{v}</td>" for v in [1, "Example FC", 2, 1, 0, 1, 3, 2, 1, 3])
        + "</tr></table>"
    )
    monkeypatch.setattr(scraper, "get_html", lambda *_: html)
    assert scraper.parse_standings(2026, "1")[0][0]["pts"] == 3


def test_missing_markup(monkeypatch):
    monkeypatch.setattr(scraper, "get_html", lambda *_: "<html>maintenance</html>")
    with pytest.raises(transport.UpstreamError):
        scraper.find_reg_year()
    with pytest.raises(transport.UpstreamError):
        scraper.parse_standings(2026, "1")


def test_transport_cache_and_status(monkeypatch):
    transport._cache.clear()
    calls = []

    class FakeClient:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, params=None):
            calls.append(url)
            return httpx.Response(
                503 if "failure" in url else 200,
                text="data",
                request=httpx.Request("GET", url),
            )

    monkeypatch.setattr(transport.httpx, "Client", FakeClient)
    assert transport.get_html("https://example.test") == "data"
    assert transport.get_html("https://example.test") == "data"
    assert len(calls) == 1
    for _ in range(2):
        with pytest.raises(transport.UpstreamError):
            transport.get_html("https://example.test/failure")
    assert len(calls) == 3
    monkeypatch.setattr(transport, "TTL_SECONDS", 0)
    transport.get_html("https://example.test")
    assert len(calls) == 4


def test_teams_year_is_a_query_parameter(monkeypatch):
    monkeypatch.setattr(main, "parse_standings", lambda *_: [[row(1)]])
    response = client.get("/divisions/1/teams?year=2026")
    assert response.status_code == 200
    assert response.json()["teams"][0]["team_slug"] == "team-1"


@pytest.mark.parametrize(
    "metric,header", [("goals", "Goals"), ("mvps", "MVPs"), ("shutouts", "Shutouts")]
)
def test_leaderboard_headers_and_multiple_pools(monkeypatch, metric, header):
    table = f"<table><tr><td>Player</td><td>Team</td><td>{header}</td></tr><tr><td>Alex (12)</td><td>Example FC</td><td>3</td></tr></table>"
    monkeypatch.setattr(scraper, "get_html", lambda *_: table * 2)
    pools = scraper.parse_player_stats(2026, "1", "unused", metric)
    assert len(pools) == 2
    assert pools[0] == [{"player": "Alex", "team": "Example FC", metric: 3}]


def test_nested_layout_does_not_duplicate_players(monkeypatch):
    monkeypatch.setattr(
        scraper,
        "get_html",
        lambda *_: (
            "<table><tr><td><table><tr><th>Player</th><th>Team</th><th>Goals</th></tr><tr><td>Alex</td><td>FC</td><td>4</td></tr></table></td></tr></table>"
        ),
    )
    pools = scraper.parse_scorers(2026, "1")
    assert len(pools) == 1
    assert len(pools[0]) == 1


def test_schedule_parses_unplayed_and_completed(monkeypatch):
    headers = [
        "Schedule",
        "Type",
        "Date",
        "Division",
        "Home",
        "Result",
        "Visiting",
        "Field",
    ]
    rows = [
        ["Regular", "League", "Sat 10/24/2026 05:00PM", "1", "A", "2-0", "B", "Park"],
        ["Regular", "League", "Sat 10/31/2026 05:00PM", "1", "B", "TBD", "A", "Park"],
    ]
    html = "<table><tr>" + "".join(f"<th>{v}</th>" for v in headers) + "</tr>"
    html += (
        "".join(
            "<tr>" + "".join(f"<td>{v}</td>" for v in row) + "</tr>" for row in rows
        )
        + "</table>"
    )
    monkeypatch.setattr(scraper, "get_html", lambda *_: html)
    matches = scraper.parse_schedule(2027, "1")
    assert matches[0]["homeresult"] == 2
    assert matches[1]["homeresult"] is None
    assert matches[1]["awayresult"] is None
    assert matches[0]["date"] == date(2026, 10, 24)


def test_team_overview_and_goal_insights(monkeypatch):
    monkeypatch.setattr(main, "parse_standings", lambda *_: [[row(1), row(2)]])
    fixtures = [
        dict(
            hometeam="Team 1",
            awayteam="Team 2",
            homeresult=2,
            awayresult=0,
            date=date(2026, 9, 1),
            field="Park",
        ),
        dict(
            hometeam="Team 2",
            awayteam="Team 1",
            homeresult=None,
            awayresult=None,
            date=date(2026, 10, 1),
            field="Park",
        ),
    ]
    monkeypatch.setattr(main, "parse_schedule", lambda *_: fixtures)
    overview = client.get("/teams/1/team-1/overview?year=2027")
    assert overview.status_code == 200
    assert overview.json()["form"][0]["result"] == "W"
    assert overview.json()["upcoming_fixture"]["is_home"] is False
    goals = client.get("/divisions/2027/1/goal-data?team_slug=team-1")
    assert goals.status_code == 200
    assert goals.json()["insights"]["clean_sheets"] == 1
    assert goals.json()["teams"][0]["gf_per_game"] == 1.5
