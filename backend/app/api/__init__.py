from fastapi import APIRouter
from app.api.endpoints import restaurants, hotpepper, auth, reviews, favorites, reservations

api_router = APIRouter()
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(hotpepper.router, prefix="/hotpepper", tags=["hotpepper"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(reservations.router, prefix="/reservations", tags=["reservations"])
