import threading
import logging
from .engine import get_user_persona, get_prompt_recommendations
from freq_backend.cache_utils import set_cached_data

logger = logging.getLogger(__name__)

def _run_in_background(target_func, *args, **kwargs):
    """
    Execute heavy compute task in an asynchronous background thread.
    Scalable worker task queue pattern.
    """
    thread = threading.Thread(target=target_func, args=args, kwargs=kwargs, daemon=True)
    thread.start()
    return thread

def async_recalculate_user_persona(user_id, username=None):
    """
    Background worker task to compute AI Persona archetype & vector profiles
    and populate Redis cache asynchronously.
    """
    def task():
        try:
            logger.info(f"[Worker Task] Recalculating AI Persona for user {user_id} ({username})...")
            persona_data = get_user_persona(user_id)
            cache_key = f"user_persona_{username or user_id}"
            set_cached_data(cache_key, persona_data, timeout_seconds=600)
            logger.info(f"[Worker Task] AI Persona cached for user {username or user_id}")
        except Exception as e:
            logger.error(f"[Worker Task Error] Persona calculation failed for {user_id}: {e}")

    return _run_in_background(task)

def async_preload_prompt_matches(prompt, top_k=6):
    """
    Background worker task to pre-compute AI prompt matches and warm up cache.
    """
    def task():
        try:
            prompt_clean = prompt.strip().lower()
            cache_key = f"prompt_match_{hash(prompt_clean)}"
            logger.info(f"[Worker Task] Warming cache for prompt: '{prompt}'...")
            matches = get_prompt_recommendations(prompt, top_k=top_k)
            set_cached_data(cache_key, matches, timeout_seconds=600)
        except Exception as e:
            logger.error(f"[Worker Task Error] Prompt match pre-calc failed: {e}")

    return _run_in_background(task)
