from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ReservationBase(BaseModel):
    restaurant_id: int
    reservation_time: datetime
    party_size: int = Field(..., gt=0)
    notes: Optional[str] = None

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    reservation_time: Optional[datetime] = None
    party_size: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None
    status: Optional[str] = None

class Reservation(ReservationBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
