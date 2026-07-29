from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_app_starts():
    response = client.get("/")
    assert response.status_code in (200, 404)  # adjust based on your actual root route
