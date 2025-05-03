from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ReviewBase(BaseModel):
    rating: float = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    restaurant_id: int

class ReviewUpdate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    user_id: int
    restaurant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
