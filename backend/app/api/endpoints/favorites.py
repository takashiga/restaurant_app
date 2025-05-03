from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.favorite import Favorite as FavoriteModel
from app.models.restaurant import Restaurant as RestaurantModel
from app.schemas.favorite import Favorite, FavoriteCreate
from app.schemas.restaurant import Restaurant
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Favorite)
async def add_favorite(
    favorite: FavoriteCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == favorite.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    existing_favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.restaurant_id == favorite.restaurant_id
    ).first()
    
    if existing_favorite:
        raise HTTPException(status_code=400, detail="Restaurant is already in favorites")
    
    db_favorite = FavoriteModel(
        user_id=current_user.id,
        restaurant_id=favorite.restaurant_id,
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite

@router.get("/", response_model=List[Restaurant])
async def get_user_favorites(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    favorites = db.query(RestaurantModel).join(
        FavoriteModel, FavoriteModel.restaurant_id == RestaurantModel.id
    ).filter(
        FavoriteModel.user_id == current_user.id
    ).all()
    
    return favorites

@router.get("/check/{restaurant_id}", response_model=bool)
async def check_favorite(
    restaurant_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.restaurant_id == restaurant_id
    ).first()
    
    return favorite is not None

@router.delete("/{restaurant_id}", response_model=dict)
async def remove_favorite(
    restaurant_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(FavoriteModel).filter(
        FavoriteModel.user_id == current_user.id,
        FavoriteModel.restaurant_id == restaurant_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Restaurant not found in favorites")
    
    db.delete(favorite)
    db.commit()
    
    return {"status": "success", "message": "Restaurant removed from favorites"}
