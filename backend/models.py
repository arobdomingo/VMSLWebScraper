from pydantic import BaseModel
from typing import Optional

# Relevant Team-Standings Models
class TeamStanding(BaseModel):
    position: int
    team_name: str
    games_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_diff: int
    points: int

class PoolStandings(BaseModel):
    pool_name: Optional[str] = None
    teams: list[TeamStanding]

class StandingsResponse(BaseModel):
    year: int
    division: str
    pools: list[PoolStandings]

# Relevant Top-Scorers Models
class Scorer(BaseModel):
    player_name: str
    team_name: str
    goals: int

class PoolScorers(BaseModel):
    pool_name: Optional[str] = None
    scorers: list[Scorer]

class ScorersResponse(BaseModel):
    year: int
    division: str
    pools: list[PoolScorers]

# Relevant MVP-List Models
class PlayerMvps(BaseModel):
    player_name: str
    team_name: str
    mvps: int

class PoolMvps(BaseModel):
    pool_name: Optional[str] = None
    player_mvps: list[PlayerMvps]

class MvpsResponse(BaseModel):
    year: int
    division: str
    pools: list[PoolMvps]

# Relevant MVP-List Models
class Keeper(BaseModel):
    player_name: str
    team_name: str
    shutouts: int

class PoolShutouts(BaseModel):
    pool_name: Optional[str] = None
    keepers: list[Keeper]

class ShutoutsResponse(BaseModel):
    year: int
    division: str
    pools: list[PoolShutouts]

# Relevant Division Models
class Division(BaseModel):
    code: str
    name: str

class DivisionCategory(BaseModel):
    category_name: str
    divisions: list[Division]

class DivisionsResponse(BaseModel):
    year: int
    categories: list[DivisionCategory]

# Relevant Team Information

class Team(BaseModel):
    team_name: str
    team_slug: str
    pool_name: Optional[str] = None

class TeamsResponse(BaseModel):
    year: int
    division: str
    teams: list[Team]

# Relevant Team Overview Information

class RivalTeam(BaseModel):
    team_name: str
    points: int
    goal_diff: int
    position: int 

class StandingsContext(BaseModel):
    pool_name: Optional[str] = None
    position: int
    standing: TeamStanding
    rivals_above: list[RivalTeam] = []
    rivals_below: list[RivalTeam] = []

class MatchSummary(BaseModel):
    date: str
    opponent: str
    is_home: bool

    # data left optional incase game is unplaed
    goals_for: Optional[int] = None
    goals_against: Optional[int] = None
    result: Optional[str] = None
    field: Optional[str] = None

class TeamScheduleResponse(BaseModel):
    year: int
    division: str
    team_name: str
    team_slug: str
    pool_name: Optional[str] = None

    played: list[MatchSummary] =[]
    upcoming: list[MatchSummary] = []

class TeamOverviewResponse(BaseModel):
    year: int
    division: str
    team_name: str
    team_slug: str
    pool_name: Optional[str] = None

    standings: Optional[StandingsContext] = None
    form: list[MatchSummary] = []
    upcoming_fixture: Optional[MatchSummary] = None

# Relevant Goal Data Infromation

class GoalDiffPoint(BaseModel):
    date: str
    gd: int

class GoalDataInsight(BaseModel):
    team_name: str
    team_slug: str

    biggest_win: Optional[MatchSummary] = None
    biggest_loss: Optional[MatchSummary] = None

    gf_over_two: int
    ga_under_one: int
    clean_sheets: int

    trend: list[GoalDiffPoint]

class TeamGoalData(BaseModel):
    team_name: str
    team_slug: str
    pool_name: Optional[str] = None

    games_played: int
    goals_for: int
    goals_against: int
    goal_diff: int

    gf_per_game: float
    ga_per_game: float
    gd_per_game: float

class GoalDataResponse(BaseModel):
    year: int
    division: str
    teams: list[TeamGoalData]
    insights: GoalDataInsight



