import logging
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.restaurant import Base
from app.models.user import User
from app.models.review import Review
from app.models.favorite import Favorite
from app.models.reservation import Reservation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations."""
    logger.info("Running database migrations...")
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if "users" not in existing_tables:
        logger.info("Creating users table...")
        User.__table__.create(engine)
    
    if "reviews" not in existing_tables:
        logger.info("Creating reviews table...")
        Review.__table__.create(engine)
    
    if "favorites" not in existing_tables:
        logger.info("Creating favorites table...")
        Favorite.__table__.create(engine)
    
    if "reservations" not in existing_tables:
        logger.info("Creating reservations table...")
        Reservation.__table__.create(engine)
    
    logger.info("Database migrations completed successfully")
