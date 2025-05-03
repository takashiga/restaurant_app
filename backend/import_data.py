import asyncio
import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.services.data_acquisition import data_acquisition_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def import_restaurants():
    """Import restaurants from HotPepper API."""
    logger.info("Starting restaurant data import...")
    
    db = SessionLocal()
    
    try:
        areas = ["新宿", "渋谷", "池袋", "銀座", "上野"]
        total_imported = 0
        
        for area in areas:
            logger.info(f"Importing restaurants from {area}...")
            count = await data_acquisition_service.import_restaurants_from_hotpepper(
                db=db,
                keyword=area,
                count=10
            )
            total_imported += count
            logger.info(f"Imported {count} restaurants from {area}")
        
        logger.info(f"Total restaurants imported: {total_imported}")
        return total_imported
    except Exception as e:
        logger.error(f"Error importing restaurants: {e}")
        return 0
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(import_restaurants())
