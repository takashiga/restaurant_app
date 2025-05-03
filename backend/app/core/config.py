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
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }

settings = Settings()
