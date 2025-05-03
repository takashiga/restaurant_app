from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.data_acquisition_google import google_data_acquisition_service
from app.schemas.restaurant import Restaurant
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.get("/test-connection", response_model=Dict[str, Any])
async def test_connection():
    """Test the connection to the Google Places API."""
    result = await google_data_acquisition_service.test_connection()
    return result

@router.get("/search", response_model=Dict[str, Any])
async def search_restaurants(
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = 1000,
    limit: int = 20,
):
    """Search for restaurants using the Google Places API."""
    if not keyword and not location and (lat is None or lng is None):
        raise HTTPException(
            status_code=400,
            detail="Either keyword, location, or lat/lng must be provided"
        )
    
    result = await google_data_acquisition_service.search_restaurants(
        keyword=keyword,
        location=location,
        lat=lat,
        lng=lng,
        radius=radius,
        limit=limit,
    )
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=400,
            detail=f"Error searching Google Places API: {result.get('status')} - {result.get('error_message', '')}"
        )
    
    return result

@router.get("/details/{place_id}", response_model=Dict[str, Any])
async def get_place_details(place_id: str):
    """Get details for a specific place using the Google Places API."""
    result = await google_data_acquisition_service.get_place_details(place_id)
    
    if result.get("status") != "OK":
        raise HTTPException(
            status_code=400,
            detail=f"Error getting place details: {result.get('status')} - {result.get('error_message', '')}"
        )
    
    return result

@router.post("/import/{place_id}", response_model=Restaurant)
async def import_restaurant(
    place_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import a restaurant from Google Places API into the database."""
    restaurant = await google_data_acquisition_service.import_restaurant_from_google(db, place_id)
    
    if not restaurant:
        raise HTTPException(
            status_code=400,
            detail="Error importing restaurant from Google Places API"
        )
    
    return restaurant

@router.post("/import-search", response_model=Dict[str, Any])
async def import_restaurants_from_search(
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[int] = 1000,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import restaurants from Google Places API search results into the database."""
    if not keyword and not location and (lat is None or lng is None):
        raise HTTPException(
            status_code=400,
            detail="Either keyword, location, or lat/lng must be provided"
        )
    
    imported_count = await google_data_acquisition_service.import_restaurants_from_google(
        db=db,
        keyword=keyword,
        location=location,
        lat=lat,
        lng=lng,
        radius=radius,
        limit=limit,
    )
    
    return {
        "status": "success",
        "message": f"Imported {imported_count} restaurants from Google Places API",
        "imported_count": imported_count
    }
