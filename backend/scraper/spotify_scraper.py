"""Spotify data scraper using spotipy library."""
import time
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_spotify_client():
    """Get authenticated Spotify client."""
    import spotipy
    from spotipy.oauth2 import SpotifyClientCredentials
    auth = SpotifyClientCredentials(
        client_id=settings.SPOTIFY_CLIENT_ID,
        client_secret=settings.SPOTIFY_CLIENT_SECRET,
    )
    return spotipy.Spotify(auth_manager=auth)


def fetch_new_releases(limit=50):
    """Fetch latest albums/tracks from Spotify."""
    sp = get_spotify_client()
    results = sp.new_releases(limit=limit)
    albums = results.get('albums', {}).get('items', [])
    tracks_data = []
    for album in albums:
        time.sleep(0.1)
        try:
            album_tracks = sp.album_tracks(album['id'])
            for track in album_tracks.get('items', [])[:3]:
                tracks_data.append({
                    'title': track['name'],
                    'spotify_id': track['id'],
                    'spotify_uri': track.get('uri', ''),
                    'duration_ms': track.get('duration_ms', 0),
                    'preview_url': track.get('preview_url', ''),
                    'is_explicit': track.get('explicit', False),
                    'album_name': album['name'],
                    'album_art_url': album['images'][0]['url'] if album.get('images') else '',
                    'artist_name': album['artists'][0]['name'] if album.get('artists') else '',
                    'artist_spotify_id': album['artists'][0]['id'] if album.get('artists') else '',
                    'release_date': album.get('release_date', ''),
                })
        except Exception as e:
            logger.error(f"Error fetching album tracks: {e}")
    return tracks_data


def fetch_artist_top_tracks(artist_spotify_id):
    """Fetch top tracks for an artist."""
    sp = get_spotify_client()
    try:
        results = sp.artist_top_tracks(artist_spotify_id)
        tracks = []
        for track in results.get('tracks', []):
            tracks.append({
                'title': track['name'],
                'spotify_id': track['id'],
                'spotify_uri': track.get('uri', ''),
                'duration_ms': track.get('duration_ms', 0),
                'preview_url': track.get('preview_url', ''),
                'is_explicit': track.get('explicit', False),
                'popularity': track.get('popularity', 0),
                'album_name': track['album']['name'] if track.get('album') else '',
                'album_art_url': track['album']['images'][0]['url'] if track.get('album', {}).get('images') else '',
                'release_date': track.get('album', {}).get('release_date', ''),
            })
        return tracks
    except Exception as e:
        logger.error(f"Error fetching top tracks: {e}")
        return []


def fetch_audio_features(track_ids):
    """Fetch audio features for a batch of tracks."""
    sp = get_spotify_client()
    features = {}
    for i in range(0, len(track_ids), 100):
        batch = track_ids[i:i+100]
        try:
            results = sp.audio_features(batch)
            for feat in results:
                if feat:
                    features[feat['id']] = {
                        'danceability': feat.get('danceability', 0),
                        'energy': feat.get('energy', 0),
                        'valence': feat.get('valence', 0),
                        'tempo': feat.get('tempo', 0),
                        'acousticness': feat.get('acousticness', 0),
                        'instrumentalness': feat.get('instrumentalness', 0),
                        'speechiness': feat.get('speechiness', 0),
                        'liveness': feat.get('liveness', 0),
                        'key': feat.get('key', 0),
                        'mode': feat.get('mode', 0),
                    }
        except Exception as e:
            logger.error(f"Error fetching audio features: {e}")
        time.sleep(0.1)
    return features


def fetch_artist_details(artist_spotify_id):
    """Fetch artist metadata from Spotify."""
    sp = get_spotify_client()
    try:
        artist = sp.artist(artist_spotify_id)
        return {
            'name': artist['name'],
            'spotify_id': artist['id'],
            'image_url': artist['images'][0]['url'] if artist.get('images') else '',
            'genres': artist.get('genres', []),
            'popularity': artist.get('popularity', 0),
            'followers_count': artist.get('followers', {}).get('total', 0),
        }
    except Exception as e:
        logger.error(f"Error fetching artist: {e}")
        return None


def search_tracks(query, limit=20):
    """Search Spotify catalog."""
    sp = get_spotify_client()
    try:
        results = sp.search(q=query, type='track', limit=limit)
        tracks = []
        for track in results.get('tracks', {}).get('items', []):
            tracks.append({
                'title': track['name'],
                'spotify_id': track['id'],
                'spotify_uri': track.get('uri', ''),
                'duration_ms': track.get('duration_ms', 0),
                'preview_url': track.get('preview_url', ''),
                'is_explicit': track.get('explicit', False),
                'popularity': track.get('popularity', 0),
                'album_name': track['album']['name'] if track.get('album') else '',
                'album_art_url': track['album']['images'][0]['url'] if track.get('album', {}).get('images') else '',
                'artist_name': track['artists'][0]['name'] if track.get('artists') else '',
                'artist_spotify_id': track['artists'][0]['id'] if track.get('artists') else '',
                'release_date': track.get('album', {}).get('release_date', ''),
            })
        return tracks
    except Exception as e:
        logger.error(f"Error searching tracks: {e}")
        return []
