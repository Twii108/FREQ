import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

def get_cached_data(key: str):
    """
    Retrieve cached data from Redis / Django Cache.
    Returns cached content if present, else None.
    """
    try:
        data = cache.get(key)
        if data is not None:
            logger.info(f"Cache HIT for key: {key}")
            return data
    except Exception as e:
        logger.warning(f"Cache GET error for key {key}: {e}")
    logger.info(f"Cache MISS for key: {key}")
    return None

def set_cached_data(key: str, value, timeout_seconds: int = 300):
    """
    Store data in Redis / Django Cache with specified TTL expiration.
    Default TTL: 300 seconds (5 minutes).
    """
    try:
        cache.set(key, value, timeout=timeout_seconds)
        logger.info(f"Cache SET success for key: {key} (TTL: {timeout_seconds}s)")
        return True
    except Exception as e:
        logger.warning(f"Cache SET error for key {key}: {e}")
        return False

def invalidate_cache(key_pattern: str):
    """
    Invalidate or delete specific cache key.
    """
    try:
        cache.delete(key_pattern)
        logger.info(f"Cache DELETED for key: {key_pattern}")
        return True
    except Exception as e:
        logger.warning(f"Cache DELETE error for key {key_pattern}: {e}")
        return False
