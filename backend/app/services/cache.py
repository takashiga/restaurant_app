import time
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class APICache:
    """Simple in-memory cache for API responses with expiration."""
    
    def __init__(self, expiration_seconds: int = 86400):  # Default: 24 hours
        """Initialize the cache.
        
        Args:
            expiration_seconds: Time in seconds before a cache entry expires
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.expiration_seconds = expiration_seconds
        logger.info(f"Initialized API cache with {expiration_seconds}s expiration")
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found or expired
        """
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        if time.time() > entry["expires_at"]:
            logger.debug(f"Cache entry for {key} has expired")
            del self.cache[key]
            return None
        
        logger.debug(f"Cache hit for {key}")
        return entry["data"]
    
    def set(self, key: str, value: Any) -> None:
        """Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self.cache[key] = {
            "data": value,
            "expires_at": time.time() + self.expiration_seconds,
            "created_at": time.time()
        }
        logger.debug(f"Cached data for {key}, expires in {self.expiration_seconds}s")
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
        logger.info("Cache cleared")
    
    def remove(self, key: str) -> None:
        """Remove a specific cache entry.
        
        Args:
            key: Cache key to remove
        """
        if key in self.cache:
            del self.cache[key]
            logger.debug(f"Removed cache entry for {key}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        return {
            "size": len(self.cache),
            "keys": list(self.cache.keys()),
            "oldest_entry": min([entry["created_at"] for entry in self.cache.values()]) if self.cache else None,
            "newest_entry": max([entry["created_at"] for entry in self.cache.values()]) if self.cache else None,
        }

class RateLimiter:
    """Rate limiter for API calls."""
    
    def __init__(self, max_calls: int = 100, period_seconds: int = 60):
        """Initialize the rate limiter.
        
        Args:
            max_calls: Maximum number of calls allowed in the period
            period_seconds: Period in seconds
        """
        self.max_calls = max_calls
        self.period_seconds = period_seconds
        self.calls: list[float] = []
        logger.info(f"Initialized rate limiter: {max_calls} calls per {period_seconds}s")
    
    def can_make_request(self) -> bool:
        """Check if a request can be made without exceeding the rate limit.
        
        Returns:
            True if request can be made, False otherwise
        """
        current_time = time.time()
        
        self.calls = [t for t in self.calls if current_time - t < self.period_seconds]
        
        if len(self.calls) >= self.max_calls:
            logger.warning(f"Rate limit reached: {len(self.calls)} calls in the last {self.period_seconds}s")
            return False
        
        return True
    
    def record_request(self) -> None:
        """Record that a request was made."""
        self.calls.append(time.time())
    
    async def wait_if_needed(self) -> None:
        """Wait if rate limit is reached.
        
        This method will sleep until a request can be made.
        """
        while not self.can_make_request():
            wait_time = 1  # Wait 1 second before checking again
            logger.info(f"Rate limit reached, waiting {wait_time}s")
            await asyncio.sleep(wait_time)
        
        self.record_request()

api_cache = APICache()
rate_limiter = RateLimiter(max_calls=5, period_seconds=1)  # HotPepper API limit: 5 requests per second

def cache_response(key_prefix: str = "", ttl: Optional[int] = None, expiration_seconds: Optional[int] = None):
    """Decorator to cache function responses.
    
    Args:
        key_prefix: Prefix for the cache key
        ttl: Optional custom expiration time in seconds (alias for expiration_seconds)
        expiration_seconds: Optional custom expiration time in seconds
    
    Returns:
        Decorated function
    """
    # Use ttl if provided, otherwise use expiration_seconds
    cache_ttl = ttl if ttl is not None else expiration_seconds
    
    def decorator(func: Callable):
        from functools import wraps
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Remove FastAPI-specific parameters that shouldn't be part of the cache key
            cache_kwargs = {k: v for k, v in kwargs.items() if k not in ['args', 'kwargs']}
            
            if cache_kwargs.get('use_cache') is False:
                cache_kwargs_copy = cache_kwargs.copy()
                if 'use_cache' in cache_kwargs_copy:
                    del cache_kwargs_copy['use_cache']
                return await func(*args, **{k: v for k, v in kwargs.items() if k not in ['use_cache']})
            
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(cache_kwargs)}"
            
            cached_result = api_cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Using cached response for {cache_key}")
                return cached_result
            
            result = await func(*args, **kwargs)
            
            if cache_ttl:
                # Save with custom expiration
                original_expiration = api_cache.expiration_seconds
                api_cache.expiration_seconds = cache_ttl
                api_cache.set(cache_key, result)
                api_cache.expiration_seconds = original_expiration
            else:
                # Save with default expiration
                api_cache.set(cache_key, result)
            
            return result
        return wrapper
    return decorator
