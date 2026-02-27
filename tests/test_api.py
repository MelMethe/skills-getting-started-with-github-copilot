from fastapi.testclient import TestClient
from src.app import app, activities
import copy

# keep a deep copy of the original in-memory data so we can reset it
_default_activities = copy.deepcopy(activities)
client = TestClient(app)


def setup_function():
    """
    Reset the global activities dict before every test.
    This implements the 'Arrange' part of each case by ensuring a
    known starting state.
    """
    activities.clear()
    activities.update(copy.deepcopy(_default_activities))


def test_get_activities():
    # Act
    resp = client.get("/activities")
    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data
    assert isinstance(data, dict)


def test_successful_signup():
    # Arrange
    email = "new@mergington.edu"
    # Act
    resp = client.post(
        "/activities/Chess Club/signup", params={"email": email}
    )
    # Assert
    assert resp.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_failure_already_signed():
    # Arrange
    email = "michael@mergington.edu"
    # Act
    resp = client.post(
        "/activities/Chess Club/signup", params={"email": email}
    )
    # Assert
    assert resp.status_code == 400
    assert "already signed up" in resp.json().get("detail", "")


def test_successful_delete():
    # Arrange
    email = "michael@mergington.edu"
    # Act
    resp = client.delete(
        "/activities/Chess Club/participants", params={"email": email}
    )
    # Assert
    assert resp.status_code == 200
    assert email not in activities["Chess Club"]["participants"]


def test_delete_failure_not_found():
    # Arrange
    email = "fake@mergington.edu"
    # Act
    resp = client.delete(
        "/activities/Chess Club/participants", params={"email": email}
    )
    # Assert
    assert resp.status_code == 404
    assert "Participant not found" in resp.json().get("detail", "")
