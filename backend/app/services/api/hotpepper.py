import httpx
import logging
import json
import hashlib
from typing import Dict, List, Optional, Any
from app.core.config import settings
from app.services.cache import api_cache, rate_limiter

logger = logging.getLogger(__name__)

class HotPepperAPI:
    """Client for interacting with the HotPepper API."""
    
    def __init__(self, api_key: Optional[str] = None, email: str = "takahiro.shiga.810@gmail.com"):
        """Initialize the HotPepper API client.
        
        Args:
            api_key: API key for HotPepper API. If not provided, uses the key from settings.
            email: Email address associated with the API key.
        """
        self.api_key = api_key or settings.API_KEY_HOTPEPPER
        self.base_url = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/"
        self.email = email
        self.attribution = "Powered by HotPepper API / Recruit Co., Ltd."
        
        if not self.api_key:
            logger.warning("HotPepper API key is not set")
        else:
            logger.info(f"HotPepper API initialized with key: {self.api_key[:4]}...{self.api_key[-4:]}")
    
    def _generate_cache_key(self, params: Dict[str, Any]) -> str:
        """Generate a cache key from request parameters.
        
        Args:
            params: Request parameters
            
        Returns:
            Cache key as a string
        """
        sorted_params = sorted(params.items())
        
        param_str = json.dumps(sorted_params)
        
        return hashlib.md5(param_str.encode()).hexdigest()
    
    async def search_restaurants(
        self,
        keyword: Optional[str] = None,
        genre: Optional[str] = None,
        area: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        range: Optional[int] = None,
        count: int = 10,
        start: int = 1,
        format_type: str = "json",
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """Search for restaurants using the HotPepper API.
        
        Args:
            keyword: Search keyword
            genre: Genre code (e.g., G001 for Japanese cuisine)
            area: Area code (e.g., Z011 for Tokyo)
            lat: Latitude for location-based search
            lng: Longitude for location-based search
            range: Search range in meters (1: 300m, 2: 500m, 3: 1000m, 4: 2000m, 5: 3000m)
            count: Number of results to return (max 100)
            start: Starting index for pagination
            format_type: Response format (json or xml)
            use_cache: Whether to use the cache
            
        Returns:
            API response as a dictionary
        """
        params = {
            "key": self.api_key,
            "count": str(count),
            "start": str(start),
            "format": format_type,
        }
        
        if keyword:
            params["keyword"] = keyword
        if genre:
            params["genre"] = genre
        if area:
            params["small_area"] = area
        if lat and lng:
            params["lat"] = str(lat)
            params["lng"] = str(lng)
        if range:
            params["range"] = str(range)
            
        if not any([keyword, genre, area, lat, lng]):
            params["large_area"] = "Z011"  # Tokyo
        
        cache_key = self._generate_cache_key(params)
        
        if use_cache:
            cached_data = api_cache.get(cache_key)
            if cached_data:
                logger.info(f"Using cached data for {cache_key}")
                return cached_data
        
        logger.info(f"Making request to HotPepper API with params: {params}")
        
        await rate_limiter.wait_if_needed()
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                
                logger.debug(f"Response status: {response.status_code}")
                logger.debug(f"Response headers: {response.headers}")
                
                content = response.text
                logger.debug(f"Response content (first 200 chars): {content[:200]}")
                
                data = response.json()
                
                if "results" in data and isinstance(data["results"], dict):
                    data["results"]["attribution"] = self.attribution
                
                if use_cache:
                    api_cache.set(cache_key, data)
                    logger.debug(f"Cached response for {cache_key}")
                
                return data
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {e}")
            logger.error(f"Response content: {e.response.content if hasattr(e, 'response') else 'No response'}")
            raise
        except Exception as e:
            logger.error(f"Error occurred: {e}")
            raise
    
    async def test_connection(self) -> bool:
        """Test the connection to the HotPepper API.
        
        Returns:
            True if the connection is successful, False otherwise
        """
        try:
            result = await self.search_restaurants(count=1, use_cache=False)
            
            logger.info(f"API test response keys: {result.keys() if result else 'No result'}")
            
            if result and "results" in result:
                results = result["results"]
                logger.info(f"Results keys: {results.keys() if isinstance(results, dict) else 'Results is not a dict'}")
                
                if isinstance(results, dict) and "shop" in results:
                    shops = results["shop"]
                    logger.info(f"Found {len(shops) if isinstance(shops, list) else 'unknown'} shops in the response")
                    logger.info("HotPepper API connection test successful")
                    return True
                else:
                    logger.warning("HotPepper API connection test failed: No 'shop' in results")
            else:
                logger.warning("HotPepper API connection test failed: No 'results' in response")
            
            logger.debug(f"Full API response: {json.dumps(result, ensure_ascii=False)[:500]}")
            return False
        except Exception as e:
            logger.error(f"HotPepper API connection test failed: {e}")
            return False
    
    def get_attribution(self) -> str:
        """Get the attribution text for HotPepper API.
        
        Returns:
            Attribution text
        """
        return self.attribution

hotpepper_api = HotPepperAPI()
