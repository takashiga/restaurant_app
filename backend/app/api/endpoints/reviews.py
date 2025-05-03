from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.review import Review as ReviewModel
from app.models.restaurant import Restaurant as RestaurantModel
from app.schemas.review import Review, ReviewCreate, ReviewUpdate
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Review)
async def create_review(
    review: ReviewCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == review.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    existing_review = db.query(ReviewModel).filter(
        ReviewModel.user_id == current_user.id,
        ReviewModel.restaurant_id == review.restaurant_id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this restaurant")
    
    db_review = ReviewModel(
        user_id=current_user.id,
        restaurant_id=review.restaurant_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    
    reviews = db.query(ReviewModel).filter(ReviewModel.restaurant_id == review.restaurant_id).all()
    total_rating = sum(r.rating for r in reviews) + review.rating
    restaurant.review_count = len(reviews) + 1
    restaurant.average_rating = total_rating / restaurant.review_count
    
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/restaurant/{restaurant_id}", response_model=List[Review])
async def get_restaurant_reviews(restaurant_id: int, db: Session = Depends(get_db)):
    reviews = db.query(ReviewModel).filter(ReviewModel.restaurant_id == restaurant_id).all()
    return reviews

@router.get("/user", response_model=List[Review])
async def get_user_reviews(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(ReviewModel).filter(ReviewModel.user_id == current_user.id).all()
    return reviews

@router.put("/{review_id}", response_model=Review)
async def update_review(
    review_id: int,
    review: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_review = db.query(ReviewModel).filter(
        ReviewModel.id == review_id,
        ReviewModel.user_id == current_user.id
    ).first()
    
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found or not owned by user")
    
    db_review.rating = review.rating
    db_review.comment = review.comment
    
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == db_review.restaurant_id).first()
    reviews = db.query(ReviewModel).filter(ReviewModel.restaurant_id == db_review.restaurant_id).all()
    total_rating = sum(r.rating for r in reviews)
    restaurant.average_rating = total_rating / restaurant.review_count
    
    db.commit()
    db.refresh(db_review)
    return db_review

@router.delete("/{review_id}", response_model=dict)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_review = db.query(ReviewModel).filter(
        ReviewModel.id == review_id,
        ReviewModel.user_id == current_user.id
    ).first()
    
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found or not owned by user")
    
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == db_review.restaurant_id).first()
    restaurant.review_count -= 1
    
    if restaurant.review_count > 0:
        reviews = db.query(ReviewModel).filter(
            ReviewModel.restaurant_id == db_review.restaurant_id,
            ReviewModel.id != review_id
        ).all()
        total_rating = sum(r.rating for r in reviews)
        restaurant.average_rating = total_rating / restaurant.review_count
    else:
        restaurant.average_rating = 0
    
    db.delete(db_review)
    db.commit()
    
    return {"status": "success", "message": "Review deleted successfully"}
