from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

restaurant_cuisine_association = Table(
    "restaurant_cuisine",
    Base.metadata,
    Column("restaurant_id", Integer, ForeignKey("restaurants.id"), primary_key=True),
    Column("cuisine_type_id", Integer, ForeignKey("cuisine_types.id"), primary_key=True),
)

restaurant_feature_association = Table(
    "restaurant_feature",
    Base.metadata,
    Column("restaurant_id", Integer, ForeignKey("restaurants.id"), primary_key=True),
    Column("special_feature_id", Integer, ForeignKey("special_features.id"), primary_key=True),
)

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_name = Column(String, index=True, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone_number = Column(String)
    website_url = Column(String)
    price_range_lunch = Column(String)
    price_range_dinner = Column(String)
    opening_hours = Column(String)
    regular_holidays = Column(String)
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    data_source = Column(String, nullable=False)
    source_id = Column(String, index=True)  # ID from the original data source
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    cuisine_types = relationship(
        "CuisineType", secondary=restaurant_cuisine_association, back_populates="restaurants"
    )
    special_features = relationship(
        "SpecialFeature", secondary=restaurant_feature_association, back_populates="restaurants"
    )
    reviews = relationship("Review", back_populates="restaurant", cascade="all, delete-orphan")

class CuisineType(Base):
    __tablename__ = "cuisine_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True)  # For API codes like HotPepper genre codes

    restaurants = relationship(
        "Restaurant", secondary=restaurant_cuisine_association, back_populates="cuisine_types"
    )

class SpecialFeature(Base):
    __tablename__ = "special_features"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True)  # For API codes

    restaurants = relationship(
        "Restaurant", secondary=restaurant_feature_association, back_populates="special_features"
    )
