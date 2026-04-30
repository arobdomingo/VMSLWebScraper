from sqlalchemy.orm import Session
from db_models import DivisionSeason, Team, Standing
from scraper import slugify_name
import models

def get_or_create_division_season(db: Session, year, division):
    ds = db.query(DivisionSeason).filter_by(
        year = year,
        division_code = division
    ).first()

    if not ds:
        ds = DivisionSeason(year = year, division_code = division)
        db.add(ds)
        db.commit()
        db.refresh(ds)
    
    return ds

def save_standings_to_db(db: Session, pools, year, division):
    ds = get_or_create_division_season(db, year, division)

    multi_pool = len(pools) > 1

    for i, pool in enumerate(pools):
        pool_name = f"Pool {chr(ord('A') + i)}" if multi_pool else None

        for row in pool:

            # Create/Find Team
            team = db.query(Team).filter_by(
                division_season_id = ds.id,
                team_slug = slugify_name(row["team"])
            ).first()

            if not team:
                team = Team(
                    division_season_id = ds.id,
                    team_name = row["team"],
                    team_slug = slugify_name(row["team"]),
                    pool_name = pool_name
                )

                db.add(team)
                db.commit()
                db.refresh(team)

            # Insert/Update Standings
            standing = db.query(Standing).filter_by(
                division_season_id = ds.id,
                team_id = team.id
            ).first()

            if not standing:
                standing = Standing(
                    division_season_id = ds.id,
                    team_id = team.id
                )

                db.add(standing)

            standing.pool_name = pool_name
            standing.position = row["position"]
            standing.games_played = row["gp"]
            standing.wins = row["w"]
            standing.draws = row["d"]
            standing.losses = row["l"]
            standing.goals_for = row["gf"]
            standing.goals_against = row["ga"]
            standing.goal_diff = row["gd"]
            standing.points = row["pts"]
        
    db.commit()

def get_standings_from_db(db: Session, year, division):
    ds = db.query(DivisionSeason).filter_by(
        year = year,
        division_code = division
    ).first()

    if ds is None:
        return None
    
    standings = (
        db.query(Standing)
        .join(Team)
        .filter(Standing.division_season_id == ds.id)
        .order_by(Standing.pool_name, Standing.position)
        .all()
    )

    if not standings:
        return None

    pools_dict = {}

    for standing in standings:
        pool_key = standing.pool_name or "default"

        if pool_key not in pools_dict:
            pools_dict[pool_key] = []

        pools_dict[pool_key].append(
            models.TeamStanding(
                position=standing.position,
                team_name=standing.team.team_name,
                games_played=standing.games_played,
                wins=standing.wins,
                draws=standing.draws,
                losses=standing.losses,
                goals_for=standing.goals_for,
                goals_against=standing.goals_against,
                goal_diff=standing.goal_diff,
                points=standing.points,
            )
        )
    
    pool_responses = []

    for pool_name, teams in pools_dict.items():
        pool_responses.append(
            models.PoolStandings(
                pool_name = None if pool_name == "default" else pool_name,
                teams = teams
            )
        )
    
    return models.StandingsResponse(
        year = year,
        division = division,
        pools = pool_responses
    )