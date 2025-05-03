from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.reservation import Reservation as ReservationModel
from app.models.restaurant import Restaurant as RestaurantModel
from app.schemas.reservation import Reservation, ReservationCreate, ReservationUpdate
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=Reservation)
async def create_reservation(
    reservation: ReservationCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    restaurant = db.query(RestaurantModel).filter(RestaurantModel.id == reservation.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if reservation.reservation_time <= datetime.now():
        raise HTTPException(status_code=400, detail="Reservation time must be in the future")
    
    db_reservation = ReservationModel(
        user_id=current_user.id,
        restaurant_id=reservation.restaurant_id,
        reservation_time=reservation.reservation_time,
        party_size=reservation.party_size,
        notes=reservation.notes,
        status="pending"
    )
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    return db_reservation

@router.get("/", response_model=List[Reservation])
async def get_user_reservations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reservations = db.query(ReservationModel).filter(
        ReservationModel.user_id == current_user.id
    ).order_by(ReservationModel.reservation_time).all()
    
    return reservations

@router.get("/restaurant/{restaurant_id}", response_model=List[Reservation])
async def get_restaurant_reservations(
    restaurant_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    reservations = db.query(ReservationModel).filter(
        ReservationModel.restaurant_id == restaurant_id,
        ReservationModel.user_id == current_user.id
    ).order_by(ReservationModel.reservation_time).all()
    
    return reservations

@router.put("/{reservation_id}", response_model=Reservation)
async def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id,
        ReservationModel.user_id == current_user.id
    ).first()
    
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found or not owned by user")
    
    if reservation.reservation_time is not None:
        if reservation.reservation_time <= datetime.now():
            raise HTTPException(status_code=400, detail="Reservation time must be in the future")
        db_reservation.reservation_time = reservation.reservation_time
        
    if reservation.party_size is not None:
        db_reservation.party_size = reservation.party_size
        
    if reservation.notes is not None:
        db_reservation.notes = reservation.notes
        
    if reservation.status is not None:
        db_reservation.status = reservation.status
    
    db.commit()
    db.refresh(db_reservation)
    return db_reservation

@router.delete("/{reservation_id}", response_model=dict)
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id,
        ReservationModel.user_id == current_user.id
    ).first()
    
    if not db_reservation:
        raise HTTPException(status_code=404, detail="Reservation not found or not owned by user")
    
    db_reservation.status = "cancelled"
    db.commit()
    
    return {"status": "success", "message": "Reservation cancelled successfully"}
