from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from scraper import parse_standings, parse_scorers, parse_mvps, parse_shutouts, find_leagues, find_reg_year, parse_schedule, slugify_name
import models as models
from typing import Optional

from sqlalchemy.orm import Session
from database import get_db
from crud import save_standings_to_db, get_standings_from_db

app = FastAPI(title = "VMSL Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173", # Vite uses local host and sometimes 127.0.0.1
        "https://vmsl-web-scraper.vercel.app",
    ],

    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers=["*"]
)

def resolve_slug(year, division, team_slug):
    pools = parse_standings(year, division)
    if not pools:
        raise HTTPException(status_code = 404, detail=f"No standings found for division '{division}' in year '{year}'.")
    
    multi_pool = len(pools) > 1

    for i, pool in enumerate(pools):
        pool_name = f"Pool {chr(ord('A') + i)}" if multi_pool else None

        for team in pool:
            name = team["team"]
            if slugify_name(name) == team_slug:
                return name, pool_name
            
    raise HTTPException(status_code=404, detail=f"Team '{team_slug}' not found in division '{division}' for year '{year}'.")

def build_standings_context(year, division, team_name):

    pools = parse_standings(year, division)
    if not pools:
        return None, None

    multi_pool = len(pools) > 1
    window = 2

    for i, pool in enumerate(pools):
        pool_name = f"Pool {chr(ord('A') + i)}" if multi_pool else None

        team_index = None
        team_row = None
        for j, row in enumerate(pool):
            if row["team"] == team_name:
                team_row = row
                team_index = j
                break

        if team_row is None:
            continue  # not in this pool, try next pool

        team_row = pool[team_index]
        position = team_index + 1

        start_above = max(0, team_index - window)
        end_above = team_index  # up to (but not including) team

        start_below = team_index + 1
        end_below = min(len(pool), team_index + 1 + window)

        if end_below - start_below < 2:
            remainder = 2 - (end_below - start_below)
            start_above = start_above - remainder

        elif end_above - start_above < 2:
            remainder = 2 - end_above - start_above
            end_below = end_below + remainder

        above_rows = pool[start_above:end_above]
        below_rows = pool[start_below:end_below]

        def to_rival(row) -> models.RivalTeam:

            return models.RivalTeam(
                team_name = row["team"],
                points = int(row["pts"]),
                goal_diff = int(row["gd"]),
                position = int(row["position"])
            )

        rivals_above = [to_rival(r) for r in above_rows]
        rivals_below = [to_rival(r) for r in below_rows]

        # Create an algorithm to build a proper list

        team_standing = models.TeamStanding(
            position=int(team_row["position"]),
            team_name=team_row["team"],
            games_played=int(team_row["gp"]),
            wins=int(team_row["w"]),
            draws=int(team_row["d"]),
            losses=int(team_row["l"]),
            goals_for=int(team_row["gf"]),
            goals_against=int(team_row["ga"]),
            goal_diff=int(team_row["gd"]),
            points=int(team_row["pts"]),
        )

        context = models.StandingsContext(
            pool_name = pool_name,
            position = int(team_row["position"]),
            standing = team_standing,
            rivals_above = rivals_above,
            rivals_below = rivals_below,
        )

        return context, pool_name

    # Team wasn't found in any pool
    return None, None

def build_match_summary(row, team_name) -> models.MatchSummary:

    home = row["hometeam"]
    away = row["awayteam"]
    is_home = (home == team_name)
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
        field = row.get("field") or None,
    )

def build_form_and_upcoming(year, division, team_name, last_n = 5):
    fixtures = parse_schedule(year, division)
    if not fixtures:
        return [], None
    
    team_matches = [m for m in fixtures if m.get("hometeam") == team_name or m.get("awayteam") == team_name]
    if not team_matches:
        return [], None
    
    def is_played(match):
        return match.get("homeresult") is not None and match.get("awayresult") is not None
    
    played = [m for m in team_matches if is_played(m)]
    upcoming = [m for m in team_matches if not is_played(m)]

    played_sorted = sorted(played, key = lambda m: m["date"])
    upcoming_sorted = sorted(upcoming, key = lambda m: m["date"])

    print(played_sorted)

    form_last = [build_match_summary(match, team_name) for match in played_sorted[-last_n:]]
    print(form_last)
    next_fixture = build_match_summary(upcoming_sorted[0], team_name) if upcoming_sorted else None

    return form_last, next_fixture

@app.get("/divisions/{year}/{division}/goal-data", response_model = models.GoalDataResponse)
def read_goal_data(year, division, team_slug):

    try:
        pools = parse_standings(year, division)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))

    if not pools:
        raise HTTPException(status_code = 404, detail = f"No standings found for division {division} in year {year}.")

    multi_pool = len(pools) > 1

    teams = []

    for i, pool in enumerate(pools):
        pool_name = f"Pool {chr(ord('A') + i)}" if multi_pool else None

        for row in pool:
            gp = int(row["gp"])
            ga = int(row["ga"])
            gf = int(row["gf"])
            gd = int(row["gd"])

            teams.append(
                models.TeamGoalData(                       
                    team_name = row["team"],
                    team_slug = slugify_name(row["team"]),
                    pool_name = pool_name,
                    games_played = gp,
                    goals_for = gf,
                    goals_against = ga,
                    goal_diff = gd,
                    gf_per_game = (gf / gp) if gp > 0 else 0.0,
                    ga_per_game = (ga / gp) if gp > 0 else 0.0,
                    gd_per_game = (gd / gp) if gp > 0 else 0.0,
                ) 
            )

    insights = None
    team_name, pool = resolve_slug(year, division, team_slug)

    fixtures = parse_schedule(year, division)
    if not fixtures:
        raise HTTPException(status_code = 404, detail = "No schedule found.")

    team_matches = [match for match in fixtures if match.get("hometeam") == team_name or match.get("awayteam") == team_name]

    def is_played(match):
        return match.get("homeresult") is not None and match.get("awayresult") is not None

    played = [match for match in team_matches if is_played(match)]
    played_summaries = [build_match_summary(match, team_name) for match in played] 

    trend = []
    for ms in played_summaries:
        if ms.goals_for is None or ms.goals_against is None:
            continue

        trend.append(models.GoalDiffPoint(date = ms.date, gd = int(ms.goals_for) - int(ms.goals_against)))

    biggest_win = None
    biggest_loss = None

    best_win_diff = None
    worst_loss_diff = None

    for ms in played_summaries:
        if ms.goals_against is None or ms.goals_for is None:
            continue

        diff = int(ms.goals_for) - int(ms.goals_against)

        if diff > 0:
            if best_win_diff is None or diff > best_win_diff:
                best_win_diff = diff
                biggest_win = ms

        if diff < 0:
            if worst_loss_diff is None or diff < worst_loss_diff:
                worst_loss_diff = diff
                biggest_loss = ms

    high_scoring_games = sum(1 for ms in played_summaries if ms.goals_for is not None and ms.goals_for >= 2)
    low_conceding_games = sum(1 for ms in played_summaries if ms.goals_against is not None and ms.goals_against <= 1) 
    clean_sheets = sum(1 for ms in played_summaries if ms.goals_against is not None and ms.goals_against == 0) 

    insights = models.GoalDataInsight(
        team_name = team_name,
        team_slug = team_slug,
        biggest_win = biggest_win,
        biggest_loss = biggest_loss,
        
        gf_over_two = high_scoring_games,
        ga_under_one = low_conceding_games,
        clean_sheets = clean_sheets,

        trend = trend,
    )

    return models.GoalDataResponse(
        year = year,
        division = division,
        teams = teams,
        insights = insights,
    )

@app.get("/teams/{division}/{team_slug}/overview", response_model=models.TeamOverviewResponse)
def team_overview(division, team_slug, year: Optional[int] = None):

    if year is None:
        year = find_reg_year()

    team_name, pool_from_lookup = resolve_slug(year, division, team_slug)

    standings_context, pool_from_standings = build_standings_context(year, division, team_name)

    form_last5, upcoming_fixture = build_form_and_upcoming(year, division, team_name, last_n = 5)

    return models.TeamOverviewResponse(
        year = year,
        division = division,
        team_name = team_name,
        team_slug = team_slug,
        pool_name = pool_from_standings or pool_from_lookup,
        standings = standings_context,
        form = form_last5,
        upcoming_fixture = upcoming_fixture,
    )

@app.get("/teams/{division}/{team_slug}/schedule", response_model = models.TeamScheduleResponse)
def team_schedule(division, team_slug, year: Optional[int] = None):
    if year is None:
        year = find_reg_year()
    
    team_name, pool = resolve_slug(year, division, team_slug)

    fixtures = parse_schedule(year, division)
    if not fixtures:
        raise HTTPException(status_code = 404, detail = "No schedule found.")
    
    team_matches = [match for match in fixtures if match.get("hometeam") == team_name or match.get("awayteam") == team_name]

    if not team_matches:
        raise HTTPException(status_code = 404, detail = f"No matches found for '{team_name}'.")
    
    def is_played(match):
        return match.get("homeresult") is not None and match.get("awayresult") is not None
    
    played = [match for match in team_matches if is_played(match)]
    upcoming = [match for match in team_matches if not is_played(match)]

    played_summaries = [build_match_summary(match, team_name) for match in played]
    upcoming_summaries= [build_match_summary(match, team_name) for match in upcoming]

    return models.TeamScheduleResponse(
        year = year,
        division = division,
        team_name = team_name,
        team_slug = team_slug, 
        pool_name = pool,
        played = played_summaries,
        upcoming = upcoming_summaries,
    )

@app.get("/divisions/{division}/teams", response_model=models.TeamsResponse)
def list_teams(year, division):

    try:
        pools = parse_standings(year, division)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    if not pools:
        raise HTTPException(status_code=404, detail=f"No teams found for division '{division}' in year '{year}'.")
    
    teams = []
    multi_pool = len(pools) > 1

    for i, pool in enumerate(pools):
        pool_name = f"Pool {chr(ord('A') + i)}" if multi_pool else None

        for team in pool:
            team_name = team["team"]
            teams.append(
                models.Team(
                    team_name=team_name,
                    team_slug=slugify_name(team_name),
                    pool_name=pool_name,
                )
            )

    seen = set()
    unique_teams = []

    # deduplication - set is used for fast membership checking
    for t in teams:
        if t.team_slug not in seen:
            seen.add(t.team_slug)
            unique_teams.append(t)

    unique_teams.sort(key = lambda t: ((t.pool_name or ""), t.team_name.lower())) # Sort by pool, then alphabetical

    return models.TeamsResponse(year = year, division = division, teams = unique_teams)

@app.get("/divisions/grouped", response_model = models.DivisionsResponse)
def list_divisions(year: Optional[int] = None):

    if year is None:
        year = find_reg_year()

    try:
        division_categories = find_leagues(year)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
    # Adapt the Error to New Dictionary Form
    
    if not division_categories:
        raise HTTPException(status_code = 404, detail = f"No divisions found for the year {year}")

    category_list = []
    for category in division_categories:
        category_model = []
        for division in division_categories[category]:
            category_model.append(models.Division(code = division["code"], name = division["name"]))
        category_list.append(models.DivisionCategory(category_name = category, divisions = category_model))

    return models.DivisionsResponse(year = year, categories = category_list)

@app.get("/divisions/{year}/{division}/standings", response_model = models.StandingsResponse)
def read_standings(year, division, db: Session = Depends(get_db)):

    cached_response = get_standings_from_db(db, year, division)

    if cached_response is not None:
        return cached_response

    try:
        pools = parse_standings(year, division)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
    if not pools:
        raise HTTPException(status_code = 404, detail = f"No standings found for division {division} in year {year}.")

    save_standings_to_db(db, pools, year, division)
    cached_response = get_standings_from_db(db, year, division)

    if cached_response is None:
        raise HTTPException(status_code = 500, detail = "Failed to save standings to database.")

    return cached_response

    # Original Function Operation

    '''
    team_standings = []
    for pool in pools:
        pool_standings = []
        for team in pool:
            pool_standings.append(models.TeamStanding(
                position = team["position"],
                team_name = team["team"],
                games_played = team["gp"],
                wins = team["w"],
                draws = team["d"],
                losses = team["l"],
                goals_for = team["gf"],
                goals_against = team["ga"],
                goal_diff = team["gd"],
                points = team["pts"],
            ))
        team_standings.append(models.PoolStandings(teams = pool_standings))
    
    if len(pools) > 1:
        for i in range(len(pools)): 
            pool_char = chr(ord('A') + i)
            team_standings[i].pool_name = "Pool " + pool_char
    
    return models.StandingsResponse(year = year, division = division, pools = team_standings)
    '''
    
@app.get("/divisions/{year}/{division}/scorers", response_model = models.ScorersResponse)
def read_scorers(year, division):
    try:
        pools = parse_scorers(year, division)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
    if not pools:
        raise HTTPException(status_code = 404, detail = f"No standings found for division {division} in year {year}.")
    
    division_scorers = []
    for pool in pools:
        pool_scorers = []
        for player in pool:
            pool_scorers.append(models.Scorer(player_name = player["player"], team_name = player["team"], goals = player["goals"]))
        division_scorers.append(models.PoolScorers(scorers = pool_scorers))
    
    if len(pools) > 1:
        for i in range(len(pools)):
            pool_char = chr(ord('A') + i)
            division_scorers[i].pool_name = "Pool " + pool_char

    return models.ScorersResponse(year = year, division = division, pools = division_scorers)

@app.get("/divisions/{year}/{division}/mvps", response_model = models.MvpsResponse)
def read_mvps(year, division):
    try:
        pools = parse_mvps(year, division)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))

    if not pools:
        raise HTTPException(status_code = 404, detail = f"No standings found for division {division} in year {year}.")
    
    division_mvps = []
    for pool in pools:
        pool_mvps = []
        for player in pool:
            pool_mvps.append(models.PlayerMvps(player_name = player["player"], team_name = player["team"], mvps = player["mvps"]))
        division_mvps.append(models.PoolMvps(player_mvps = pool_mvps))
    
    if len(pools) > 1:
        for i in range(len(pools)):
            pool_char = chr(ord('A') + i)
            division_mvps[i].pool_name = "Pool " + pool_char         

    return models.MvpsResponse(year = year, division = division, pools = division_mvps)

@app.get("/divisions/{year}/{division}/shutouts", response_model = models.ShutoutsResponse)
def read_shutouts(year, division):
    try:
        pools = parse_shutouts(year, division)
    except Exception as e:
        raise HTTPException(status_code = 500, detail = str(e))
    
    if not pools:
        raise HTTPException(status_code = 404, detail = "No standings found for division {division} in year {year}.")
    
    division_shutouts = []
    for pool in pools:
        pool_shutouts = []
        for player in pool:
            pool_shutouts.append(models.Keeper(player_name = player["player"], team_name = player["team"], shutouts = player["shutouts"]))
        division_shutouts.append(models.PoolShutouts(keepers = pool_shutouts))
    
    if len(pools) > 1:
        for i in range(len(pools)):
            pool_char = chr(ord('A') + i)
            division_shutouts[i].pool_name = "Pool " + pool_char         

    return models.ShutoutsResponse(year = year, division = division, pools = division_shutouts)


            
