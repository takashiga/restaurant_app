import logging
import aiohttp
from typing import Dict, Any, List, Optional
from urllib.parse import urlencode

from app.core.config import settings
from app.services.cache import cache_response

logger = logging.getLogger(__name__)

class GooglePlacesAPI:
    """Google Places API client."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Google Places API client.
        
        Args:
            api_key: API key for Google Places API. If not provided, uses the key from settings.
        """
        self.api_key = api_key or settings.API_KEY_GOOGLE
        self.base_url = "https://maps.googleapis.com/maps/api/place"
        self.attribution = "Powered by Google Places API"
        
        if not self.api_key:
            logger.warning("Google Places API key is not set")
        else:
            logger.info(f"Google Places API initialized with key: {self.api_key[:4]}...{self.api_key[-4:]}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection to the Google Places API."""
        if not self.api_key:
            return {"status": "error", "message": "API key is not set"}
        
        try:
            result = await self.search_restaurants(
                keyword="restaurant",
                lat=35.6812,
                lng=139.7671,
                radius=1000,
                limit=1,
                use_cache=False
            )
            
            if result.get("status") == "OK":
                return {"status": "success", "message": "Connection successful"}
            else:
                return {"status": "error", "message": f"API returned status: {result.get('status')}"}
        except Exception as e:
            logger.error(f"Error testing Google Places API connection: {e}")
            return {"status": "error", "message": str(e)}
    
    @cache_response(ttl=3600)
    async def search_restaurants(
        self,
        keyword: Optional[str] = None,
        location: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[int] = 1000,
        language: str = "ja",
        type: str = "restaurant",
        limit: int = 20,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """Search for restaurants using the Google Places API.
        
        Args:
            keyword: Search keyword
            location: Location name (e.g., "Tokyo, Japan")
            lat: Latitude for location-based search
            lng: Longitude for location-based search
            radius: Search radius in meters
            language: Response language
            type: Place type (default: restaurant)
            limit: Maximum number of results to return
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary containing search results
        """
        if not self.api_key:
            return {"status": "error", "message": "API key is not set"}
        
        params = {
            "key": self.api_key,
            "language": language,
            "type": type,
            "radius": radius,
        }
        
        if keyword:
            params["keyword"] = keyword
            
        if location:
            params["location"] = location
        elif lat is not None and lng is not None:
            params["location"] = f"{lat},{lng}"
        else:
            return {"status": "error", "message": "Either location or lat/lng must be provided"}
        
        url = f"{self.base_url}/nearbysearch/json?{urlencode(params)}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
                    
                    if data.get("status") != "OK":
                        logger.error(f"Google Places API error: {data.get('status')} - {data.get('error_message', '')}")
                        return data
                    
                    if "results" in data and limit:
                        data["results"] = data["results"][:limit]
                    
                    return data
        except Exception as e:
            logger.error(f"Error searching Google Places API: {e}")
            return {"status": "error", "message": str(e)}
    
    @cache_response(ttl=86400)  # Cache for 24 hours
    async def get_place_details(
        self,
        place_id: str,
        language: str = "ja",
        fields: Optional[List[str]] = None,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """Get details for a specific place using the Google Places API.
        
        Args:
            place_id: Google Places ID
            language: Response language
            fields: List of fields to include in the response
            use_cache: Whether to use cached results
            
        Returns:
            Dictionary containing place details
        """
        if not self.api_key:
            return {"status": "error", "message": "API key is not set"}
        
        params = {
            "key": self.api_key,
            "place_id": place_id,
            "language": language,
        }
        
        if fields:
            params["fields"] = ",".join(fields)
        
        url = f"{self.base_url}/details/json?{urlencode(params)}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
                    
                    if data.get("status") != "OK":
                        logger.error(f"Google Places API error: {data.get('status')} - {data.get('error_message', '')}")
                    
                    return data
        except Exception as e:
            logger.error(f"Error getting place details from Google Places API: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_attribution(self) -> str:
        """Get the attribution text for Google Places API."""
        return self.attribution

google_places_api = GooglePlacesAPI()
