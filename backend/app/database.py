from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite URL
DATABASE_URL = "sqlite:///./hiremate.db"

# Engine / session
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base declarative so models can import it
Base = declarative_base()

# Import models after `Base` is defined so they register correctly
from app.models import user, resume, analysis, interview  # noqa: E402

# Create tables
Base.metadata.create_all(bind=engine)
print(">>> DATABASE.PY LOADED <<<")
