import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class Settings(BaseModel):
    """Application settings."""
    
    API_KEY_HOTPEPPER: str = os.getenv("API_KEY_HOTPEPPER", "")
    API_URL_HOTPEPPER: str = os.getenv("API_URL_HOTPEPPER", "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/")
    API_KEY_YAHOO: str = os.getenv("API_KEY_YAHOO", "")
    API_URL_YAHOO: str = os.getenv("API_URL_YAHOO", "")
    API_KEY_GOOGLE: str = os.getenv("API_KEY_GOOGLE", "")
    API_URL_GOOGLE: str = os.getenv("API_URL_GOOGLE", "")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./restaurant_app.db")
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }

settings = Settings()
