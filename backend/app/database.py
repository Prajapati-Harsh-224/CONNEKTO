import os
from collections.abc import Generator
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

try:
    import pymysql
    DEFAULT_DATABASE_URL = "mysql+pymysql://root:password@localhost:3306/connekto"
except ImportError:
    DEFAULT_DATABASE_URL = "mysql+mysqldb://root:password@localhost:3306/connekto"

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

if DATABASE_URL.startswith("mysql+pymysql"):
    try:
        import pymysql
    except ImportError:
        DATABASE_URL = DATABASE_URL.replace("mysql+pymysql", "mysql+mysqldb", 1)

if DATABASE_URL.startswith("mysql"):
    mysql_engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
    try:
        with mysql_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        engine = mysql_engine
    except Exception:
        DATABASE_URL = "sqlite:///./connekto.db"
        engine = create_engine(DATABASE_URL, future=True)
else:
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
