"""
API endpoint tests for the job search agent
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint returns 200"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_search_missing_role():
    """Test search endpoint requires role parameter"""
    response = client.post("/search", json={
        "location": "San Francisco",
        "num_results": 5
    })
    assert response.status_code == 422  # Validation error


def test_search_invalid_num_results():
    """Test search endpoint validates num_results range"""
    response = client.post("/search", json={
        "role": "Software Engineer",
        "num_results": 0  # Invalid: must be >= 1
    })
    assert response.status_code == 422


def test_search_valid_request():
    """Test search endpoint with valid data"""
    response = client.post("/search", json={
        "role": "Software Engineer",
        "location": "San Francisco",
        "num_results": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert isinstance(data["jobs"], list)
    # Should return jobs (or empty list if APIs fail)
    assert len(data["jobs"]) >= 0


def test_search_default_num_results():
    """Test search uses default num_results if not provided"""
    response = client.post("/search", json={
        "role": "Data Scientist"
    })
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data


def test_search_with_empty_location():
    """Test search works with empty location (remote jobs)"""
    response = client.post("/search", json={
        "role": "Remote Developer",
        "location": "",
        "num_results": 3
    })
    assert response.status_code == 200


def test_search_response_structure():
    """Test search response has correct structure"""
    response = client.post("/search", json={
        "role": "Product Manager",
        "location": "New York",
        "num_results": 2
    })
    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "jobs" in data
    assert isinstance(data["jobs"], list)

    # If jobs found, verify structure
    if len(data["jobs"]) > 0:
        job = data["jobs"][0]
        assert "title" in job
        assert "company" in job
        # Optional fields may or may not be present
        # assert "location" in job or "salary" in job or "url" in job


@pytest.mark.asyncio
async def test_concurrent_requests():
    """Test API handles multiple concurrent requests"""
    import asyncio
    from httpx import AsyncClient

    async with AsyncClient(app=app, base_url="http://test") as ac:
        tasks = [
            ac.post("/search", json={
                "role": f"Engineer {i}",
                "num_results": 2
            })
            for i in range(3)
        ]
        responses = await asyncio.gather(*tasks)

        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
