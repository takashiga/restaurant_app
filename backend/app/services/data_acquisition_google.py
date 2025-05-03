import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.restaurant import Restaurant, CuisineType, SpecialFeature
from app.schemas.restaurant import RestaurantCreate
from app.services.api.google_places import google_places_api

logger = logging.getLogger(__name__)

class GoogleDataAcquisitionService:
    """Service for acquiring data from Google Places API."""
    
    def __init__(self):
        """Initialize the Google Places data acquisition service."""
        self.api = google_places_api
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to the Google Places API."""
        return await self.api.test_connection()
    
    async def search_restaurants(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[int] = 1000,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """Search for restaurants using the Google Places API."""
        return await self.api.search_restaurants(
            keyword=keyword,
            location=location,
            lat=lat,
            lng=lng,
            radius=radius,
            limit=limit,
        )
    
    async def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """Get details for a specific place using the Google Places API."""
        fields = [
            "name", "formatted_address", "geometry", "formatted_phone_number",
            "website", "price_level", "opening_hours", "rating", "user_ratings_total",
            "types", "photos"
        ]
        return await self.api.get_place_details(place_id=place_id, fields=fields)
    
    def transform_google_data(self, place_data: Dict[str, Any]) -> RestaurantCreate:
        """Transform Google Places API data to match our database schema."""
        place = place_data.get("result", {})
        
        name = place.get("name", "")
        address = place.get("formatted_address", "")
        
        geometry = place.get("geometry", {})
        location = geometry.get("location", {})
        latitude = location.get("lat")
        longitude = location.get("lng")
        
        phone_number = place.get("formatted_phone_number", "")
        website_url = place.get("website", "")
        
        price_level = place.get("price_level")
        price_range = None
        if price_level is not None:
            if price_level == 0:
                price_range = "~¥1,000"
            elif price_level == 1:
                price_range = "¥1,000~¥2,000"
            elif price_level == 2:
                price_range = "¥2,000~¥4,000"
            elif price_level == 3:
                price_range = "¥4,000~¥8,000"
            elif price_level == 4:
                price_range = "¥8,000~"
        
        opening_hours_data = place.get("opening_hours", {})
        weekday_text = opening_hours_data.get("weekday_text", [])
        opening_hours = "\n".join(weekday_text) if weekday_text else None
        
        rating = place.get("rating")
        review_count = place.get("user_ratings_total")
        
        types = place.get("types", [])
        cuisine_types = []
        
        cuisine_mapping = {
            "restaurant": "レストラン",
            "cafe": "カフェ",
            "bar": "バー",
            "bakery": "ベーカリー",
            "food": "フード",
            "meal_takeaway": "テイクアウト",
            "meal_delivery": "デリバリー",
            "japanese_restaurant": "和食",
            "sushi_restaurant": "寿司",
            "ramen_restaurant": "ラーメン",
            "chinese_restaurant": "中華",
            "italian_restaurant": "イタリアン",
            "french_restaurant": "フレンチ",
            "thai_restaurant": "タイ料理",
            "indian_restaurant": "インド料理",
            "korean_restaurant": "韓国料理",
            "vietnamese_restaurant": "ベトナム料理",
            "mexican_restaurant": "メキシコ料理",
        }
        
        for type_name in types:
            if type_name in cuisine_mapping:
                cuisine_types.append({"name": cuisine_mapping[type_name], "code": type_name})
        
        special_features = []
        
        if opening_hours_data.get("open_now"):
            special_features.append({"name": "営業中", "code": "open_now"})
        
        restaurant_data = {
            "restaurant_name": name,
            "address": address,
            "latitude": latitude,
            "longitude": longitude,
            "phone_number": phone_number,
            "website_url": website_url,
            "price_range_lunch": price_range,
            "price_range_dinner": price_range,
            "opening_hours": opening_hours,
            "regular_holidays": None,  # Not directly available from Google Places
            "average_rating": rating,
            "review_count": review_count,
            "data_source": "Google Places API",
            "source_id": place.get("place_id"),
            "cuisine_types": cuisine_types,
            "special_features": special_features,
        }
        
        return RestaurantCreate(**restaurant_data)
    
    async def import_restaurant_from_google(
        self, db: Session, place_id: str
    ) -> Optional[Restaurant]:
        """Import a restaurant from Google Places API into the database."""
        try:
            place_data = await self.get_place_details(place_id)
            
            if place_data.get("status") != "OK":
                logger.error(f"Error getting place details: {place_data.get('status')}")
                return None
            
            restaurant_data = self.transform_google_data(place_data)
            
            existing_restaurant = db.query(Restaurant).filter(
                Restaurant.source_id == place_id,
                Restaurant.data_source == "Google Places API"
            ).first()
            
            if existing_restaurant:
                logger.info(f"Restaurant already exists: {restaurant_data.restaurant_name}")
                return existing_restaurant
            
            restaurant = Restaurant(
                restaurant_name=restaurant_data.restaurant_name,
                address=restaurant_data.address,
                latitude=restaurant_data.latitude,
                longitude=restaurant_data.longitude,
                phone_number=restaurant_data.phone_number,
                website_url=restaurant_data.website_url,
                price_range_lunch=restaurant_data.price_range_lunch,
                price_range_dinner=restaurant_data.price_range_dinner,
                opening_hours=restaurant_data.opening_hours,
                regular_holidays=restaurant_data.regular_holidays,
                average_rating=restaurant_data.average_rating,
                review_count=restaurant_data.review_count,
                data_source="Google Places API",
                source_id=place_id,
            )
            
            db.add(restaurant)
            db.flush()
            
            for cuisine_type_data in restaurant_data.cuisine_types:
                cuisine_type = db.query(CuisineType).filter(
                    CuisineType.code == cuisine_type_data["code"]
                ).first()
                
                if not cuisine_type:
                    cuisine_type = CuisineType(**cuisine_type_data)
                    db.add(cuisine_type)
                    db.flush()
                
                restaurant.cuisine_types.append(cuisine_type)
            
            for feature_data in restaurant_data.special_features:
                feature = db.query(SpecialFeature).filter(
                    SpecialFeature.code == feature_data["code"]
                ).first()
                
                if not feature:
                    feature = SpecialFeature(**feature_data)
                    db.add(feature)
                    db.flush()
                
                restaurant.special_features.append(feature)
            
            db.commit()
            db.refresh(restaurant)
            
            logger.info(f"Imported restaurant from Google Places: {restaurant.restaurant_name}")
            return restaurant
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error importing restaurant from Google Places: {e}")
            return None
    
    async def import_restaurants_from_google(
        self,
        db: Session,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[int] = 1000,
        limit: int = 10,
    ) -> int:
        """Import restaurants from Google Places API into the database.
        
        Returns:
            Number of restaurants imported
        """
        try:
            search_results = await self.search_restaurants(
                keyword=keyword,
                location=location,
                lat=lat,
                lng=lng,
                radius=radius,
                limit=limit,
            )
            
            if search_results.get("status") != "OK":
                logger.error(f"Error searching for restaurants: {search_results.get('status')}")
                return 0
            
            results = search_results.get("results", [])
            imported_count = 0
            
            for result in results:
                place_id = result.get("place_id")
                if not place_id:
                    continue
                
                restaurant = await self.import_restaurant_from_google(db, place_id)
                if restaurant:
                    imported_count += 1
            
            return imported_count
            
        except Exception as e:
            logger.error(f"Error importing restaurants from Google Places: {e}")
            return 0

google_data_acquisition_service = GoogleDataAcquisitionService()
