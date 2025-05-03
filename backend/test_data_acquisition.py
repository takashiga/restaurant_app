import asyncio
import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.services.api.hotpepper import hotpepper_api
from app.services.data_acquisition import data_acquisition_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_hotpepper_api():
    """Test the HotPepper API connection and search functionality."""
    logger.info("Testing HotPepper API connection...")
    is_connected = await hotpepper_api.test_connection()
    
    if is_connected:
        logger.info("Successfully connected to HotPepper API")
        
        logger.info("Testing search functionality...")
        results = await hotpepper_api.search_restaurants(keyword="新宿", count=3)
        
        if "results" in results and "shop" in results["results"]:
            shops = results["results"]["shop"]
            logger.info(f"Found {len(shops)} restaurants")
            
            if shops:
                shop = shops[0]
                logger.info(f"Restaurant: {shop.get('name')}")
                logger.info(f"Address: {shop.get('address')}")
                logger.info(f"Genre: {shop.get('genre', {}).get('name')}")
                logger.info(f"URL: {shop.get('urls', {}).get('pc')}")
                
                logger.info("Testing data transformation...")
                restaurant_data = data_acquisition_service.transform_hotpepper_data(shop)
                logger.info(f"Transformed data: {restaurant_data}")
                
                return True
        else:
            logger.error("No restaurants found in search results")
    else:
        logger.error("Failed to connect to HotPepper API")
    
    return False

async def test_data_import():
    """Test importing restaurant data into the database."""
    logger.info("Testing data import...")
    
    db = SessionLocal()
    
    try:
        count = await data_acquisition_service.import_restaurants_from_hotpepper(
            db=db,
            keyword="新宿",
            count=5
        )
        
        logger.info(f"Imported {count} restaurants")
        return count > 0
    except Exception as e:
        logger.error(f"Error importing restaurants: {e}")
        return False
    finally:
        db.close()

async def main():
    """Run all tests."""
    Base.metadata.create_all(bind=engine)
    
    api_test_result = await test_hotpepper_api()
    logger.info(f"API Test Result: {'Success' if api_test_result else 'Failure'}")
    
    import_test_result = await test_data_import()
    logger.info(f"Import Test Result: {'Success' if import_test_result else 'Failure'}")

if __name__ == "__main__":
    asyncio.run(main())
