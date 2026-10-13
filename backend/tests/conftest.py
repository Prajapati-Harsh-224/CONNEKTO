import os
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["TESTING"] = "true"
test_db_path = Path(__file__).resolve().parents[2] / "backend_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path.as_posix()}"

from app.main import limiter

@pytest.fixture(autouse=True)
def disable_limiter_in_tests():
    limiter.enabled = False
    yield
