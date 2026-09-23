import os
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["TESTING"] = "true"

from app.main import limiter

@pytest.fixture(autouse=True)
def disable_limiter_in_tests():
    limiter.enabled = False
    yield
