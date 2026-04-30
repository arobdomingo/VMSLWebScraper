from backend.database import engine, Base
from backend import db_models

def init_db():
    Base.metadata.create_all(bind = engine)

if __name__ == "__main__":
    init_db()