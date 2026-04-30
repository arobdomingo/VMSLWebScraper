from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://alexanderdomingo@localhost:5432/vmsl"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping = True,
)

SessionLocal = sessionmaker(
    autoflush = False,
    autocommit = False,
    bind = engine,
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()