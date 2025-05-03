import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_restaurants():
    """Test GET /api/v1/restaurants/ endpoint."""
    response = client.get("/api/v1/restaurants/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    if data:
        restaurant = data[0]
        assert "id" in restaurant
        assert "restaurant_name" in restaurant
        assert "address" in restaurant
        assert "data_source" in restaurant

def test_search_restaurants():
    """Test GET /api/v1/restaurants/search/ endpoint."""
    response = client.get("/api/v1/restaurants/search/", params={"q": "新宿"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_restaurant_by_id():
    """Test GET /api/v1/restaurants/{id}/ endpoint."""
    response = client.get("/api/v1/restaurants/")
    assert response.status_code == 200
    restaurants = response.json()
    
    if restaurants:
        restaurant_id = restaurants[0]["id"]
        response = client.get(f"/api/v1/restaurants/{restaurant_id}/")
        assert response.status_code == 200
        restaurant = response.json()
        assert restaurant["id"] == restaurant_id
        assert "restaurant_name" in restaurant
        assert "address" in restaurant
    else:
        pytest.skip("No restaurants in database to test with")

def test_get_cuisine_types():
    """Test GET /api/v1/restaurants/cuisine-types/ endpoint."""
    response = client.get("/api/v1/restaurants/cuisine-types/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_special_features():
    """Test GET /api/v1/restaurants/special-features/ endpoint."""
    response = client.get("/api/v1/restaurants/special-features/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_nearby_restaurants():
    """Test GET /api/v1/restaurants/nearby/ endpoint."""
    params = {
        "latitude": 35.6812,
        "longitude": 139.7671,
        "radius": 5000,
        "limit": 10
    }
    response = client.get("/api/v1/restaurants/nearby/", params=params)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
