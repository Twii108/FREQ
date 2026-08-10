"""MusicBrainz data scraper using musicbrainzngs."""
import logging
import musicbrainzngs

logger = logging.getLogger(__name__)
musicbrainzngs.set_useragent("Freq", "1.0", "freq@example.com")


def fetch_artist_metadata(artist_name):
    """Fetch detailed artist info from MusicBrainz."""
    try:
        result = musicbrainzngs.search_artists(artist=artist_name, limit=1)
        artists = result.get('artist-list', [])
        if artists:
            a = artists[0]
            return {
                'name': a.get('name', ''),
                'country': a.get('country', ''),
                'type': a.get('type', ''),
                'disambiguation': a.get('disambiguation', ''),
                'mbid': a.get('id', ''),
            }
    except Exception as e:
        logger.error(f"Error fetching MusicBrainz artist: {e}")
    return None


def fetch_release_info(album_name):
    """Fetch release dates and labels."""
    try:
        result = musicbrainzngs.search_releases(release=album_name, limit=1)
        releases = result.get('release-list', [])
        if releases:
            r = releases[0]
            return {
                'title': r.get('title', ''),
                'date': r.get('date', ''),
                'country': r.get('country', ''),
                'status': r.get('status', ''),
            }
    except Exception as e:
        logger.error(f"Error fetching MusicBrainz release: {e}")
    return None
