from pydantic import BaseModel
from datetime import datetime

class FavoriteBase(BaseModel):
    restaurant_id: int

class FavoriteCreate(FavoriteBase):
    pass

class Favorite(FavoriteBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
