"""Last.fm data scraper using pylast library."""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_lastfm_client():
    """Get authenticated Last.fm client."""
    import pylast
    return pylast.LastFMNetwork(
        api_key=settings.LASTFM_API_KEY,
        api_secret=settings.LASTFM_API_SECRET,
    )


def fetch_top_artists(limit=50):
    """Fetch globally trending artists."""
    try:
        network = get_lastfm_client()
        chart = network.get_top_artists(limit=limit)
        return [{'name': a.item.name, 'playcount': a.weight} for a in chart]
    except Exception as e:
        logger.error(f"Error fetching top artists: {e}")
        return []


def fetch_artist_tags(artist_name):
    """Fetch genre tags for an artist."""
    try:
        network = get_lastfm_client()
        artist = network.get_artist(artist_name)
        tags = artist.get_top_tags(limit=5)
        return [tag.item.name for tag in tags]
    except Exception as e:
        logger.error(f"Error fetching tags for {artist_name}: {e}")
        return []


def fetch_similar_artists(artist_name):
    """Fetch related/similar artists."""
    try:
        network = get_lastfm_client()
        artist = network.get_artist(artist_name)
        similar = artist.get_similar(limit=10)
        return [{'name': s.item.name, 'match': s.match} for s in similar]
    except Exception as e:
        logger.error(f"Error fetching similar artists: {e}")
        return []
