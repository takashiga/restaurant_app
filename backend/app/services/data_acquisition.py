import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.services.api.hotpepper import hotpepper_api
from app.models.restaurant import Restaurant, CuisineType, SpecialFeature, restaurant_cuisine_association, restaurant_feature_association
from app.schemas.restaurant import RestaurantCreate

logger = logging.getLogger(__name__)

class DataAcquisitionService:
    """Service for acquiring restaurant data from various sources."""
    
    def __init__(self):
        """Initialize the data acquisition service."""
        self.hotpepper_api = hotpepper_api
    
    async def fetch_restaurants_from_hotpepper(
        self,
        keyword: Optional[str] = None,
        genre: Optional[str] = None,
        area: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        range: Optional[int] = None,
        count: int = 100,
        start: int = 1,
    ) -> List[Dict[str, Any]]:
        """Fetch restaurant data from HotPepper API.
        
        Args:
            keyword: Search keyword
            genre: Genre code
            area: Area code
            lat: Latitude
            lng: Longitude
            range: Search range
            count: Number of results to return
            start: Starting index for pagination
            
        Returns:
            List of restaurant data dictionaries
        """
        try:
            response = await self.hotpepper_api.search_restaurants(
                keyword=keyword,
                genre=genre,
                area=area,
                lat=lat,
                lng=lng,
                range=range,
                count=count,
                start=start,
            )
            
            if "results" in response and "shop" in response["results"]:
                shops = response["results"]["shop"]
                logger.info(f"Fetched {len(shops)} restaurants from HotPepper API")
                return shops
            else:
                logger.warning("No restaurants found in HotPepper API response")
                return []
        except Exception as e:
            logger.error(f"Error fetching restaurants from HotPepper API: {e}")
            return []
    
    def transform_hotpepper_data(self, shop_data: Dict[str, Any]) -> RestaurantCreate:
        """Transform HotPepper API data to match our database schema.
        
        Args:
            shop_data: Restaurant data from HotPepper API
            
        Returns:
            RestaurantCreate object with transformed data
        """
        cuisine_types = []
        if "genre" in shop_data and shop_data["genre"]:
            cuisine_types.append(shop_data["genre"]["name"])
        if "sub_genre" in shop_data and shop_data["sub_genre"]:
            cuisine_types.append(shop_data["sub_genre"]["name"])
        
        special_features = []
        
        if "english" in shop_data and shop_data["english"] == "1":
            special_features.append("英語メニューあり")
        
        if "private_room" in shop_data and shop_data["private_room"] != "なし":
            special_features.append("個室あり")
        
        if "non_smoking" in shop_data and shop_data["non_smoking"] != "なし":
            special_features.append("禁煙")
        
        if "parking" in shop_data and shop_data["parking"] != "なし":
            special_features.append("駐車場あり")
        
        if "wifi" in shop_data and shop_data["wifi"] != "なし":
            special_features.append("Wi-Fiあり")
        
        price_range_lunch = None
        price_range_dinner = None
        
        if "budget" in shop_data and shop_data["budget"]:
            price_range_dinner = shop_data["budget"]["name"]
        
        if "lunch" in shop_data and shop_data["lunch"] == "1":
            if "budget_lunch" in shop_data and shop_data["budget_lunch"]:
                price_range_lunch = shop_data["budget_lunch"]
        
        restaurant_data = {
            "restaurant_name": shop_data.get("name", ""),
            "address": shop_data.get("address", ""),
            "latitude": float(shop_data.get("lat", 0)),
            "longitude": float(shop_data.get("lng", 0)),
            "phone_number": shop_data.get("tel", ""),
            "website_url": shop_data.get("urls", {}).get("pc", ""),
            "price_range_lunch": price_range_lunch,
            "price_range_dinner": price_range_dinner,
            "opening_hours": shop_data.get("open", ""),
            "regular_holidays": shop_data.get("close", ""),
            "data_source": "HotPepper",
            "source_id": shop_data.get("id", ""),
            "cuisine_types": cuisine_types,
            "special_features": special_features,
        }
        
        return RestaurantCreate(**restaurant_data)
    
    async def import_restaurants_from_hotpepper(
        self,
        db: Session,
        keyword: Optional[str] = None,
        genre: Optional[str] = None,
        area: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        range: Optional[int] = None,
        count: int = 100,
        start: int = 1,
    ) -> int:
        """Import restaurants from HotPepper API into the database.
        
        Args:
            db: Database session
            keyword: Search keyword
            genre: Genre code
            area: Area code
            lat: Latitude
            lng: Longitude
            range: Search range
            count: Number of results to return
            start: Starting index for pagination
            
        Returns:
            Number of restaurants imported
        """
        shops = await self.fetch_restaurants_from_hotpepper(
            keyword=keyword,
            genre=genre,
            area=area,
            lat=lat,
            lng=lng,
            range=range,
            count=count,
            start=start,
        )
        
        imported_count = 0
        
        for shop_data in shops:
            try:
                existing_restaurant = db.query(Restaurant).filter(
                    Restaurant.source_id == shop_data.get("id", ""),
                    Restaurant.data_source == "HotPepper"
                ).first()
                
                if existing_restaurant:
                    logger.debug(f"Restaurant {shop_data.get('name')} already exists, updating")
                    restaurant_data = self.transform_hotpepper_data(shop_data)
                    
                    for key, value in restaurant_data.dict(exclude={"cuisine_types", "special_features"}).items():
                        setattr(existing_restaurant, key, value)
                    
                    self._update_cuisine_types(db, existing_restaurant, restaurant_data.cuisine_types)
                    
                    self._update_special_features(db, existing_restaurant, restaurant_data.special_features)
                    
                    existing_restaurant.updated_at = datetime.utcnow()
                    db.commit()
                else:
                    logger.debug(f"Adding new restaurant {shop_data.get('name')}")
                    restaurant_data = self.transform_hotpepper_data(shop_data)
                    
                    new_restaurant = Restaurant(**restaurant_data.dict(exclude={"cuisine_types", "special_features"}))
                    new_restaurant.created_at = datetime.utcnow()
                    new_restaurant.updated_at = datetime.utcnow()
                    
                    db.add(new_restaurant)
                    db.flush()  # Flush to get the ID
                    
                    self._add_cuisine_types(db, new_restaurant, restaurant_data.cuisine_types)
                    
                    self._add_special_features(db, new_restaurant, restaurant_data.special_features)
                    
                    db.commit()
                
                imported_count += 1
            except Exception as e:
                db.rollback()
                logger.error(f"Error importing restaurant {shop_data.get('name')}: {e}")
        
        logger.info(f"Imported {imported_count} restaurants from HotPepper API")
        return imported_count
    
    def _add_cuisine_types(self, db: Session, restaurant: Restaurant, cuisine_type_names: List[str]):
        """Add cuisine types to a restaurant.
        
        Args:
            db: Database session
            restaurant: Restaurant object
            cuisine_type_names: List of cuisine type names
        """
        for name in cuisine_type_names:
            cuisine_type = db.query(CuisineType).filter(CuisineType.name == name).first()
            
            if not cuisine_type:
                cuisine_type = CuisineType(name=name, code=name.lower().replace(" ", "_"))
                db.add(cuisine_type)
                db.flush()
            
            restaurant.cuisine_types.append(cuisine_type)
    
    def _update_cuisine_types(self, db: Session, restaurant: Restaurant, cuisine_type_names: List[str]):
        """Update cuisine types for a restaurant.
        
        Args:
            db: Database session
            restaurant: Restaurant object
            cuisine_type_names: List of cuisine type names
        """
        restaurant.cuisine_types = []
        
        self._add_cuisine_types(db, restaurant, cuisine_type_names)
    
    def _add_special_features(self, db: Session, restaurant: Restaurant, feature_names: List[str]):
        """Add special features to a restaurant.
        
        Args:
            db: Database session
            restaurant: Restaurant object
            feature_names: List of feature names
        """
        for name in feature_names:
            feature = db.query(SpecialFeature).filter(SpecialFeature.name == name).first()
            
            if not feature:
                feature = SpecialFeature(name=name, code=name.lower().replace(" ", "_"))
                db.add(feature)
                db.flush()
            
            restaurant.special_features.append(feature)
    
    def _update_special_features(self, db: Session, restaurant: Restaurant, feature_names: List[str]):
        """Update special features for a restaurant.
        
        Args:
            db: Database session
            restaurant: Restaurant object
            feature_names: List of feature names
        """
        restaurant.special_features = []
        
        self._add_special_features(db, restaurant, feature_names)

data_acquisition_service = DataAcquisitionService()
