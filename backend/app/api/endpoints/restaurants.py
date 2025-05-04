from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, Integer
import math
import logging
import traceback

from app.db.database import get_db
from app.models.restaurant import Restaurant as RestaurantModel, CuisineType, SpecialFeature
from app.models.restaurant import restaurant_cuisine_association, restaurant_feature_association
from app.schemas.restaurant import Restaurant, RestaurantCreate, RestaurantUpdate, RestaurantSearch, CuisineType as CuisineTypeSchema, SpecialFeature as SpecialFeatureSchema
from app.services.cache import cache_response

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search/", response_model=List[Restaurant])
@cache_response(key_prefix="restaurant_search", expiration_seconds=1800)  # 30 minutes
async def search_restaurants(
    request: Request,
    q: str = "",
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
@cache_response(key_prefix="restaurant_nearby", expiration_seconds=900)  # 15 minutes
async def get_nearby_restaurants(
    request: Request,
    latitude: float = Query(..., description="Latitude of the center point"),
    longitude: float = Query(..., description="Longitude of the center point"),
    radius: float = Query(2.0, ge=0.1, le=50.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results to return"),
):
    """
    Get restaurants near a specific location.
    
    - **latitude**: Latitude of the center point
    - **longitude**: Longitude of the center point
    - **radius**: Search radius in kilometers (default: 2)
    """
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Request query params: {request.query_params}")
    logger.info(f"Raw request parameters: latitude={latitude}, longitude={longitude}, radius={radius}, limit={limit}")
    
    try:
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
        
        logger.info(f"Found {len(restaurants)} nearby restaurants within {radius}km of ({latitude}, {longitude})")
        
        return restaurants
    except Exception as e:
        logger.error(f"Error fetching nearby restaurants: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return []

@router.get("/cuisine-types/", response_model=List[CuisineTypeSchema])
@cache_response(key_prefix="cuisine_types", expiration_seconds=86400)  # 24 hours
async def get_cuisine_types(
    request: Request,
    db: Session = Depends(get_db), 
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Get all cuisine types.
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    """
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Request query params: {request.query_params}")
    logger.info(f"Raw request parameters for cuisine types: skip={skip}, limit={limit}")
    logger.info(f"Fetching all cuisine types with offset={skip}, limit={limit}")
    try:
        cuisine_types = db.query(CuisineType).offset(skip).limit(limit).all()
        logger.info(f"Found {len(cuisine_types)} cuisine types")
        
        if cuisine_types:
            sample = cuisine_types[:3]
            logger.info(f"Sample cuisine types: {[{'id': c.id, 'name': c.name} for c in sample]}")
        
        return cuisine_types
    except Exception as e:
        logger.error(f"Error fetching cuisine types: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return []

@router.get("/special-features/", response_model=List[SpecialFeatureSchema])
@cache_response(key_prefix="special_features", expiration_seconds=86400)  # 24 hours
async def get_special_features(
    request: Request,
    db: Session = Depends(get_db), 
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """
    Get all special features.
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    """
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Request query params: {request.query_params}")
    logger.info(f"Raw request parameters for special features: skip={skip}, limit={limit}")
    logger.info(f"Parameter types: skip={type(skip)}, limit={type(limit)}")
    logger.info(f"Fetching all special features with offset={skip}, limit={limit}")
    try:
        special_features = db.query(SpecialFeature).offset(skip).limit(limit).all()
        logger.info(f"Found {len(special_features)} special features")
        
        if special_features:
            sample = special_features[:3]
            logger.info(f"Sample special features: {[{'id': f.id, 'name': f.name} for f in sample]}")
        
        return special_features
    except Exception as e:
        logger.error(f"Error fetching special features: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return []

@router.get("/", response_model=List[Restaurant])
@cache_response(key_prefix="restaurant_list", expiration_seconds=3600)  # 1 hour
async def get_restaurants(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    name: str = Query("", min_length=0),
    cuisine_type: str = Query("", min_length=0),
    area: str = Query("", min_length=0),
    min_price: int = Query(0, ge=0),
    max_price: int = Query(0, ge=0),
    special_feature: str = Query("", min_length=0),
    latitude: float = Query(0.0),
    longitude: float = Query(0.0),
    radius: float = Query(0.0, ge=0.0),
):
    """
    Get a list of restaurants with optional filtering.
    
    All parameters are optional with sensible defaults.
    """
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Request query params: {request.query_params}")
    logger.info(f"Parameter types: skip={type(skip)}, limit={type(limit)}, name={type(name)}, cuisine_type={type(cuisine_type)}, area={type(area)}, min_price={type(min_price)}, max_price={type(max_price)}, special_feature={type(special_feature)}, latitude={type(latitude)}, longitude={type(longitude)}, radius={type(radius)}")
    logger.info(f"Raw request parameters: skip={skip}, limit={limit}, name={name}, cuisine_type={cuisine_type}, area={area}, min_price={min_price}, max_price={max_price}, special_feature={special_feature}, latitude={latitude}, longitude={longitude}, radius={radius}")
    
    try:
        name = None if name == "" else name
        cuisine_type = None if cuisine_type == "" else cuisine_type
        area = None if area == "" else area
        special_feature = None if special_feature == "" else special_feature
        
        logger.info(f"Get restaurants params: name={name}, cuisine_type={cuisine_type}, area={area}, special_feature={special_feature}")
        
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
        
        if latitude != 0.0 and longitude != 0.0 and radius != 0.0:
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
        
        logger.info(f"Found {len(restaurants)} restaurants with offset={skip}, limit={limit}")
        
        if restaurants:
            sample = restaurants[:3]
            logger.info(f"Sample restaurants: {[{'id': r.id, 'name': r.restaurant_name} for r in sample]}")
        
        return restaurants
    except Exception as e:
        logger.error(f"Error fetching restaurants: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return []

@router.get("/{restaurant_id}", response_model=Restaurant)
@cache_response(key_prefix="restaurant_detail", expiration_seconds=21600)  # 6 hours
async def get_restaurant(
    request: Request,
    restaurant_id: int = Path(..., gt=0, description="ID of the restaurant to retrieve"),
    db: Session = Depends(get_db)
):
    """
    Get a specific restaurant by ID.
    """
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Fetching restaurant with ID: {restaurant_id}")
    
    try:
        restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == restaurant_id).first()
        if restaurant is None:
            logger.warning(f"Restaurant with ID {restaurant_id} not found")
            raise HTTPException(status_code=404, detail="Restaurant not found")
        
        logger.info(f"Found restaurant: {restaurant.restaurant_name}")
        return restaurant
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching restaurant with ID {restaurant_id}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")

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
