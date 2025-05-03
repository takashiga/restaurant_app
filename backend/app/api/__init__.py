from fastapi import APIRouter
from app.api.endpoints import restaurants, hotpepper, auth

api_router = APIRouter()
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(hotpepper.router, prefix="/hotpepper", tags=["hotpepper"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
