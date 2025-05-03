import logging
from sqlalchemy import inspect
from sqlalchemy.orm import Session
from app.db.database import Base, engine
from app.models.restaurant import CuisineType, SpecialFeature
from app.models.user import User
from app.db.migrations import run_migrations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    """Initialize the database."""
    logger.info("Creating database tables...")
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if "restaurants" not in existing_tables:
        logger.info("Creating initial tables...")
        Base.metadata.create_all(bind=engine)
    
    run_migrations()
    
    logger.info("Database initialization completed")

def seed_initial_data(db: Session):
    cuisine_types = [
        {"name": "寿司", "code": "sushi"},
        {"name": "ラーメン", "code": "ramen"},
        {"name": "焼肉", "code": "yakiniku"},
        {"name": "イタリアン", "code": "italian"},
        {"name": "フレンチ", "code": "french"},
        {"name": "中華", "code": "chinese"},
        {"name": "和食", "code": "japanese"},
        {"name": "カフェ", "code": "cafe"},
        {"name": "居酒屋", "code": "izakaya"}
    ]
    
    for cuisine in cuisine_types:
        db_cuisine = db.query(CuisineType).filter(CuisineType.code == cuisine["code"]).first()
        if not db_cuisine:
            db.add(CuisineType(**cuisine))
    
    special_features = [
        {"name": "英語メニューあり", "code": "english_menu"},
        {"name": "ハラル対応", "code": "halal"},
        {"name": "ヴィーガン対応", "code": "vegan"},
        {"name": "個室あり", "code": "private_room"},
        {"name": "テラス席あり", "code": "terrace"},
        {"name": "Wi-Fiあり", "code": "wifi"},
        {"name": "駐車場あり", "code": "parking"},
        {"name": "ペット可", "code": "pet_friendly"},
        {"name": "禁煙", "code": "non_smoking"}
    ]
    
    for feature in special_features:
        db_feature = db.query(SpecialFeature).filter(SpecialFeature.code == feature["code"]).first()
        if not db_feature:
            db.add(SpecialFeature(**feature))
    
    db.commit()
