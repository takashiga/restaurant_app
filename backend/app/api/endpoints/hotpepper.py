from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.database import get_db
from app.services.api.hotpepper import hotpepper_api
from app.services.data_acquisition import data_acquisition_service
from app.models.restaurant import Restaurant

router = APIRouter()

@router.get("/test-connection")
async def test_hotpepper_connection():
    """
    Test the connection to the HotPepper API.
    """
    try:
        is_connected = await hotpepper_api.test_connection()
        if is_connected:
            return {"status": "success", "message": "Successfully connected to HotPepper API"}
        else:
            raise HTTPException(status_code=500, detail="Failed to connect to HotPepper API")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing HotPepper API connection: {str(e)}")

@router.get("/search")
async def search_restaurants(
    keyword: Optional[str] = None,
    genre: Optional[str] = None,
    area: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    range: Optional[int] = None,
    count: int = 10,
    start: int = 1,
):
    """
    Search for restaurants using the HotPepper API.
    """
    try:
        results = await hotpepper_api.search_restaurants(
            keyword=keyword,
            genre=genre,
            area=area,
            lat=lat,
            lng=lng,
            range=range,
            count=count,
            start=start,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching restaurants: {str(e)}")

@router.post("/import")
async def import_restaurants(
    background_tasks: BackgroundTasks,
    keyword: Optional[str] = None,
    genre: Optional[str] = None,
    area: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    range: Optional[int] = None,
    count: int = 100,
    start: int = 1,
    db: Session = Depends(get_db),
):
    """
    Import restaurants from HotPepper API into the database.
    This endpoint can be used to trigger data acquisition manually or via a scheduled task.
    """
    try:
        background_tasks.add_task(
            data_acquisition_service.import_restaurants_from_hotpepper,
            db=db,
            keyword=keyword,
            genre=genre,
            area=area,
            lat=lat,
            lng=lng,
            range=range,
            count=count,
            start=start,
        )
        return {"status": "success", "message": "Restaurant import started in background"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing restaurants: {str(e)}")

@router.get("/import/status")
async def get_import_status(db: Session = Depends(get_db)):
    """
    Get the status of restaurant data in the database.
    """
    try:
        restaurant_count = db.query(Restaurant).count()
        latest_restaurant = db.query(Restaurant).order_by(Restaurant.updated_at.desc()).first()
        
        return {
            "status": "success",
            "restaurant_count": restaurant_count,
            "latest_update": latest_restaurant.updated_at if latest_restaurant else None,
            "data_source": "HotPepper API",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting import status: {str(e)}")

@router.post("/import/tokyo")
async def import_tokyo_restaurants(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Import restaurants from Tokyo area as a starting dataset.
    """
    try:
        areas = ["新宿", "渋谷", "池袋", "銀座", "六本木"]
        
        for area in areas:
            background_tasks.add_task(
                data_acquisition_service.import_restaurants_from_hotpepper,
                db=db,
                keyword=area,
                count=100,
            )
        
        return {
            "status": "success", 
            "message": f"Started importing restaurants from {len(areas)} areas in Tokyo"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing Tokyo restaurants: {str(e)}")
