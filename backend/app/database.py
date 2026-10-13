import os
from typing import Generator
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

workspace_data_db = Path(__file__).resolve().parents[2] / "data" / "connekto.db"
default_db = f"sqlite:///{workspace_data_db.as_posix()}" if workspace_data_db.exists() else "sqlite:///connekto.db"
DATABASE_URL = os.getenv("DATABASE_URL", default_db)

if DATABASE_URL.startswith("sqlite"):
    sqlite_db_path = Path(DATABASE_URL.split("sqlite:///", 1)[1] if DATABASE_URL.startswith("sqlite:///") else "/app/connekto.db")
    if not sqlite_db_path.is_absolute() and workspace_data_db.exists():
        sqlite_db_path = workspace_data_db
    sqlite_db_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{sqlite_db_path.as_posix()}"

try:
    if DATABASE_URL.startswith("mysql") or DATABASE_URL.startswith("postgresql"):
        db_engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
        with db_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        engine = db_engine
    else:
        engine = create_engine(DATABASE_URL, future=True)
except Exception:
    fallback_path = workspace_data_db if workspace_data_db.exists() else Path("/app/data/connekto.db")
    fallback_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{fallback_path.as_posix()}"
    engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
