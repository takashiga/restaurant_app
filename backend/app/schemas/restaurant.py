from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class CuisineTypeBase(BaseModel):
    name: str
    code: Optional[str] = None

class SpecialFeatureBase(BaseModel):
    name: str
    code: Optional[str] = None

class RestaurantBase(BaseModel):
    restaurant_name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: Optional[str] = None
    website_url: Optional[str] = None
    price_range_lunch: Optional[str] = None
    price_range_dinner: Optional[str] = None
    opening_hours: Optional[str] = None
    regular_holidays: Optional[str] = None
    review_count: Optional[int] = 0
    average_rating: Optional[float] = 0.0
    data_source: str
    source_id: Optional[str] = None

class CuisineTypeCreate(CuisineTypeBase):
    pass

class SpecialFeatureCreate(SpecialFeatureBase):
    pass

class RestaurantCreate(RestaurantBase):
    cuisine_types: Optional[List[str]] = []
    special_features: Optional[List[str]] = []

class RestaurantUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_number: Optional[str] = None
    website_url: Optional[str] = None
    price_range_lunch: Optional[str] = None
    price_range_dinner: Optional[str] = None
    opening_hours: Optional[str] = None
    regular_holidays: Optional[str] = None
    review_count: Optional[int] = None
    average_rating: Optional[float] = None
    data_source: Optional[str] = None
    source_id: Optional[str] = None
    cuisine_types: Optional[List[str]] = None
    special_features: Optional[List[str]] = None

class CuisineType(CuisineTypeBase):
    id: int

    class Config:
        orm_mode = True

class SpecialFeature(SpecialFeatureBase):
    id: int

    class Config:
        orm_mode = True

class Restaurant(RestaurantBase):
    id: int
    cuisine_types: List[CuisineType] = []
    special_features: List[SpecialFeature] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class RestaurantSearch(BaseModel):
    keyword: Optional[str] = None
    cuisine_type: Optional[str] = None
    area: Optional[str] = None
    price_range: Optional[str] = None
    special_feature: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[int] = 3000  # Default radius in meters
    limit: Optional[int] = 20
    offset: Optional[int] = 0
