from datetime import date
import pytest
from fastapi.testclient import TestClient
from backend import main
from backend.analytics import venue_split, fixture_difficulty


def match(home, away, hg, ag, day=1):
    return dict(
        hometeam=home,
        awayteam=away,
        homeresult=hg,
        awayresult=ag,
        date=date(2026, 10, day),
    )


def standing(name, gp=3, pts=6):
    return dict(team=name, position=1, gp=gp, pts=pts, gf=4, ga=2, gd=2, w=2, d=0, l=1)


def test_splits_include_zero_draw_and_away_perspective():
    fixtures = [
        match("A", "B", 0, 0),
        match("B", "A", 1, 3),
        match("A", "B", None, None),
        match("C", "B", 4, 0),
        match("A", "B", 2, None),
    ]
    home = venue_split(fixtures, "A", True)
    away = venue_split(fixtures, "A", False)
    assert (home.games_played, home.draws, home.clean_sheets, home.points_per_game) == (
        1,
        1,
        1,
        1,
    )
    assert (away.wins, away.goals_for, away.goals_against, away.points_per_game) == (
        1,
        3,
        1,
        3,
    )
    assert venue_split([], "A", True).points_per_game is None
    assert venue_split([], "A", False).gf_per_game is None


@pytest.mark.parametrize(
    "gp,pts,label",
    [(3, 6, "High"), (3, 3, "Medium"), (3, 2, "Low"), (0, 0, "Unavailable")],
)
def test_difficulty_thresholds(gp, pts, label):
    rating = fixture_difficulty("A", "B", [[standing("A"), standing("B", gp, pts)]])
    assert rating.label == label
    assert rating.opponent_games == gp


def test_cross_pool_or_missing_opponents_have_no_rating():
    pools = [[standing("A")], [standing("B")]]
    assert fixture_difficulty("A", "B", pools).opponent_ppg is None
    assert fixture_difficulty("A", "missing", pools).label == "Unavailable"


def test_analysis_contract_and_selection(monkeypatch):
    monkeypatch.setattr(
        main, "parse_standings", lambda *_: [[standing("A"), standing("B")]]
    )
    monkeypatch.setattr(main, "league_today", lambda: date(2026, 10, 15))
    monkeypatch.setattr(
        main,
        "parse_schedule",
        lambda *_: [
            match("A", "B", 0, 0),
            match("B", "A", 2, 1, 3),
            match("A", "B", None, None, 5),
            match("B", "A", None, None, 20),
        ],
    )
    client = TestClient(main.app)
    data = client.get("/teams/1/a/analysis?year=2027&opponent_slug=b").json()
    assert data["team"]["points_per_game"] == 2
    assert data["away"]["losses"] == 1
    assert [m["result"] for m in data["meetings"]] == ["L", "D"]
    assert data["opponent"]["form"][0]["result"] == "D"
    assert data["opponents"][0]["team_slug"] == "b"
    assert data["next_difficulty"]["label"] == "High"
    assert (
        client.get("/teams/1/a/analysis?year=2027&opponent_slug=a").status_code == 422
    )
    assert (
        client.get("/teams/1/a/analysis?year=2027&opponent_slug=missing").status_code
        == 404
    )
    assert client.get("/teams/1/a/analysis?year=1800").status_code == 422
    _, upcoming = main.build_form_and_upcoming(2027, "1", "A")
    assert upcoming.date == "2026-10-20"


def test_analysis_empty_schedule_and_no_meetings(monkeypatch):
    monkeypatch.setattr(
        main, "parse_standings", lambda *_: [[standing("A", 0, 0)], [standing("B")]]
    )
    monkeypatch.setattr(main, "parse_schedule", lambda *_: [])
    data = (
        TestClient(main.app).get("/teams/1/a/analysis?year=2027&opponent_slug=b").json()
    )
    assert data["team"]["points_per_game"] is None
    assert data["team"]["pool_name"] == "Pool A"
    assert data["opponent"]["pool_name"] == "Pool B"
    assert data["meetings"] == []
    assert data["home"]["games_played"] == 0
    assert data["next_difficulty"] is None
