from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, Integer
import math

from app.db.database import get_db
from app.models.restaurant import Restaurant as RestaurantModel, CuisineType, SpecialFeature
from app.models.restaurant import restaurant_cuisine_association, restaurant_feature_association
from app.schemas.restaurant import Restaurant, RestaurantCreate, RestaurantUpdate, RestaurantSearch, CuisineType as CuisineTypeSchema, SpecialFeature as SpecialFeatureSchema

router = APIRouter()

@router.get("/search/", response_model=List[Restaurant])
async def search_restaurants(
    q: str = Query(..., description="Search keyword"),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
):
    """
    Search for restaurants by keyword.
    The search is performed on restaurant name, address, and cuisine types.
    """
    query = db.query(RestaurantModel).distinct()
    
    name_address_filter = or_(
        RestaurantModel.restaurant_name.ilike(f"%{q}%"),
        RestaurantModel.address.ilike(f"%{q}%")
    )
    
    cuisine_filter = RestaurantModel.id.in_(
        db.query(restaurant_cuisine_association.c.restaurant_id)
        .join(CuisineType, CuisineType.id == restaurant_cuisine_association.c.cuisine_type_id)
        .filter(CuisineType.name.ilike(f"%{q}%"))
        .subquery()
    )
    
    query = query.filter(or_(name_address_filter, cuisine_filter))
    
    restaurants = query.offset(skip).limit(limit).all()
    return restaurants

@router.get("/nearby/", response_model=List[Restaurant])
async def get_nearby_restaurants(
    latitude: float = Query(..., description="Latitude"),
    longitude: float = Query(..., description="Longitude"),
    radius: float = Query(2.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    """
    Get restaurants near a specific location.
    
    - **latitude**: Latitude of the center point
    - **longitude**: Longitude of the center point
    - **radius**: Search radius in kilometers (default: 2)
    """
    query = db.query(RestaurantModel)
    
    query = query.filter(
        RestaurantModel.latitude.isnot(None),
        RestaurantModel.longitude.isnot(None)
    )
    
    earth_radius = 6371  # Earth radius in kilometers
    
    lat1 = func.radians(latitude)
    lon1 = func.radians(longitude)
    lat2 = func.radians(RestaurantModel.latitude)
    lon2 = func.radians(RestaurantModel.longitude)
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = func.pow(func.sin(dlat / 2), 2) + func.cos(lat1) * func.cos(lat2) * func.pow(func.sin(dlon / 2), 2)
    c = 2 * func.asin(func.sqrt(a))
    distance = earth_radius * c
    
    query = query.filter(distance <= radius).order_by(distance)
    
    restaurants = query.limit(limit).all()
    
    return restaurants

@router.get("/cuisine-types/", response_model=List[CuisineTypeSchema])
async def get_cuisine_types(db: Session = Depends(get_db)):
    """
    Get all cuisine types.
    """
    cuisine_types = db.query(CuisineType).all()
    return cuisine_types

@router.get("/special-features/", response_model=List[SpecialFeatureSchema])
async def get_special_features(db: Session = Depends(get_db)):
    """
    Get all special features.
    """
    special_features = db.query(SpecialFeature).all()
    return special_features

@router.get("/", response_model=List[Restaurant])
async def get_restaurants(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
    cuisine_type: Optional[str] = None,
    area: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    special_feature: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius: Optional[float] = None,
):
    """
    Get a list of restaurants with optional filtering.
    
    - **name**: Filter by restaurant name
    - **cuisine_type**: Filter by cuisine type
    - **area**: Filter by area/location
    - **min_price**: Minimum price for dinner
    - **max_price**: Maximum price for dinner
    - **special_feature**: Filter by special feature
    - **latitude**: Latitude for location-based search
    - **longitude**: Longitude for location-based search
    - **radius**: Search radius in kilometers
    """
    query = db.query(RestaurantModel).distinct()
    
    if name:
        query = query.filter(RestaurantModel.restaurant_name.ilike(f"%{name}%"))
    
    if cuisine_type:
        cuisine_subquery = db.query(restaurant_cuisine_association.c.restaurant_id).join(
            CuisineType, 
            CuisineType.id == restaurant_cuisine_association.c.cuisine_type_id
        ).filter(
            CuisineType.name.ilike(f"%{cuisine_type}%")
        ).subquery()
        
        query = query.filter(RestaurantModel.id.in_(cuisine_subquery))
    
    if area:
        query = query.filter(RestaurantModel.address.ilike(f"%{area}%"))
    
    if min_price:
        query = query.filter(RestaurantModel.price_range_dinner.like(f"%{min_price}%"))
    
    if max_price:
        query = query.filter(RestaurantModel.price_range_dinner.like(f"%{max_price}%"))
    
    if special_feature:
        feature_subquery = db.query(restaurant_feature_association.c.restaurant_id).join(
            SpecialFeature, 
            SpecialFeature.id == restaurant_feature_association.c.special_feature_id
        ).filter(
            SpecialFeature.name.ilike(f"%{special_feature}%")
        ).subquery()
        
        query = query.filter(RestaurantModel.id.in_(feature_subquery))
    
    if latitude and longitude and radius:
        earth_radius = 6371  # Earth radius in kilometers
        
        lat1 = func.radians(latitude)
        lon1 = func.radians(longitude)
        lat2 = func.radians(RestaurantModel.latitude)
        lon2 = func.radians(RestaurantModel.longitude)
        
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = func.pow(func.sin(dlat / 2), 2) + func.cos(lat1) * func.cos(lat2) * func.pow(func.sin(dlon / 2), 2)
        c = 2 * func.asin(func.sqrt(a))
        distance = earth_radius * c
        
        query = query.filter(distance <= radius)
    
    # Ensure we only return distinct restaurants
    query = query.distinct()
    
    total = query.count()
    restaurants = query.offset(skip).limit(limit).all()
    
    return restaurants

@router.get("/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Get a specific restaurant by ID.
    """
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@router.post("/", response_model=Restaurant)
async def create_restaurant(restaurant: RestaurantCreate, db: Session = Depends(get_db)):
    """
    Create a new restaurant.
    """
    db_restaurant = RestaurantModel(**restaurant.dict(exclude={"cuisine_types", "special_features"}))
    db.add(db_restaurant)
    db.flush()
    
    for cuisine_name in restaurant.cuisine_types:
        cuisine_type = db.query(CuisineType).filter(CuisineType.name == cuisine_name).first()
        if not cuisine_type:
            cuisine_type = CuisineType(name=cuisine_name, code=cuisine_name.lower().replace(" ", "_"))
            db.add(cuisine_type)
            db.flush()
        db_restaurant.cuisine_types.append(cuisine_type)
    
    for feature_name in restaurant.special_features:
        feature = db.query(SpecialFeature).filter(SpecialFeature.name == feature_name).first()
        if not feature:
            feature = SpecialFeature(name=feature_name, code=feature_name.lower().replace(" ", "_"))
            db.add(feature)
            db.flush()
        db_restaurant.special_features.append(feature)
    
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.put("/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(
    restaurant_id: int, 
    restaurant: RestaurantUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a restaurant by ID.
    """
    db_restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    update_data = restaurant.dict(exclude_unset=True, exclude={"cuisine_types", "special_features"})
    for key, value in update_data.items():
        setattr(db_restaurant, key, value)
    
    if restaurant.cuisine_types is not None:
        db_restaurant.cuisine_types = []
        for cuisine_name in restaurant.cuisine_types:
            cuisine_type = db.query(CuisineType).filter(CuisineType.name == cuisine_name).first()
            if not cuisine_type:
                cuisine_type = CuisineType(name=cuisine_name, code=cuisine_name.lower().replace(" ", "_"))
                db.add(cuisine_type)
                db.flush()
            db_restaurant.cuisine_types.append(cuisine_type)
    
    if restaurant.special_features is not None:
        db_restaurant.special_features = []
        for feature_name in restaurant.special_features:
            feature = db.query(SpecialFeature).filter(SpecialFeature.name == feature_name).first()
            if not feature:
                feature = SpecialFeature(name=feature_name, code=feature_name.lower().replace(" ", "_"))
                db.add(feature)
                db.flush()
            db_restaurant.special_features.append(feature)
    
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@router.delete("/{restaurant_id}", response_model=dict)
async def delete_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    """
    Delete a restaurant by ID.
    """
    db_restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
    if db_restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    db.delete(db_restaurant)
    db.commit()
    
    return {"status": "success", "message": f"Restaurant with ID {restaurant_id} deleted successfully"}
