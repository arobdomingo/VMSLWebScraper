from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from backend.database import Base

class DivisionSeason(Base):
    __tablename__ = "division_seasons"

    id = Column(Integer, primary_key = True, index = True)
    year = Column(Integer, nullable = False, index = True)
    division_code = Column(String, nullable = False, index = True)

    __table_args__ = (
        UniqueConstraint("year", "division_code", name = "uq_division_season"),
    )

    teams = relationship("Team", back_populates="division_season", cascade = "all, delete-orphan")
    standings_rows = relationship("Standing", back_populates="division_season", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="division_season", cascade="all, delete-orphan")
    scorers = relationship("ScorerStat", back_populates="division_season", cascade="all, delete-orphan")
    mvps = relationship("MvpStat", back_populates="division_season", cascade="all, delete-orphan")
    shutouts = relationship("ShutoutStat", back_populates="division_season", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key = True, index = True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable = False, index = True)

    team_name = Column(String, nullable = False)
    team_slug = Column(String, nullable = False, index = True)
    pool_name = Column(String, nullable = True)

    __table_args__ = (
        UniqueConstraint("division_season_id", "team_slug", name = "uq_team_per_division_season"),
    )

    division_season = relationship("DivisionSeason", back_populates="teams")

    standings = relationship("Standing", back_populates="team", cascade="all, delete-orphan")
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    scorer_stats = relationship("ScorerStat", back_populates="team", cascade="all, delete-orphan")
    mvp_stats = relationship("MvpStat", back_populates="team", cascade="all, delete-orphan")
    shutout_stats = relationship("ShutoutStat", back_populates="team", cascade="all, delete-orphan")

class Standing(Base):
    __tablename__ = "standings"

    id = Column(Integer, primary_key = True, index = True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable = False, index = True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable = False, index = True)

    pool_name = Column(String, nullable=True)
    position = Column(Integer, nullable=False)
    games_played = Column(Integer, nullable=False)
    wins = Column(Integer, nullable=False)
    draws = Column(Integer, nullable=False)
    losses = Column(Integer, nullable=False)
    goals_for = Column(Integer, nullable=False)
    goals_against = Column(Integer, nullable=False)
    goal_diff = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("division_season_id", "team_id", name="uq_standing_per_team"),
    )

    division_season = relationship("DivisionSeason", back_populates="standings_rows")
    team = relationship("Team", back_populates="standings")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable=False, index=True)

    match_date = Column(DateTime, nullable=False, index=True)
    field = Column(String, nullable=True)

    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)

    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    is_played = Column(Boolean, nullable=False, default=False)

    raw_home_team_name = Column(String, nullable=True)
    raw_away_team_name = Column(String, nullable=True)

    division_season = relationship("DivisionSeason", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")

class ScorerStat(Base):
    __tablename__ = "scorer_stats"

    id = Column(Integer, primary_key=True, index=True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)

    pool_name = Column(String, nullable=True)
    player_name = Column(String, nullable=False, index=True)
    goals = Column(Integer, nullable=False)

    division_season = relationship("DivisionSeason", back_populates="scorers")
    team = relationship("Team", back_populates="scorer_stats")


class MvpStat(Base):
    __tablename__ = "mvp_stats"

    id = Column(Integer, primary_key=True, index=True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)

    pool_name = Column(String, nullable=True)
    player_name = Column(String, nullable=False, index=True)
    mvps = Column(Integer, nullable=False)

    division_season = relationship("DivisionSeason", back_populates="mvps")
    team = relationship("Team", back_populates="mvp_stats")

class ShutoutStat(Base):
    __tablename__ = "shutout_stats"

    id = Column(Integer, primary_key=True, index=True)
    division_season_id = Column(Integer, ForeignKey("division_seasons.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)

    pool_name = Column(String, nullable=True)
    player_name = Column(String, nullable=False, index=True)
    shutouts = Column(Integer, nullable=False)

    division_season = relationship("DivisionSeason", back_populates="shutouts")
    team = relationship("Team", back_populates="shutout_stats")