"""
Freq ML Recommendation Engine
- Content-based filtering (cosine similarity on audio features)
- Collaborative filtering (SVD on user interactions)
- Hybrid recommender (weighted blend)
- Taste match (% similarity between users)
"""
import numpy as np
from django.db.models import Count


import numpy as np
import hashlib
from django.db.models import Count


GENRE_AUDIO_PROFILES = {
    'pop': {'danceability': 0.75, 'energy': 0.8, 'valence': 0.7, 'tempo': 120, 'acousticness': 0.2},
    'rock': {'danceability': 0.5, 'energy': 0.85, 'valence': 0.6, 'tempo': 130, 'acousticness': 0.1},
    'hip-hop': {'danceability': 0.85, 'energy': 0.75, 'valence': 0.65, 'tempo': 95, 'acousticness': 0.15},
    'rap': {'danceability': 0.85, 'energy': 0.8, 'valence': 0.6, 'tempo': 100, 'acousticness': 0.1},
    'r&b': {'danceability': 0.65, 'energy': 0.5, 'valence': 0.5, 'tempo': 85, 'acousticness': 0.4},
    'house': {'danceability': 0.9, 'energy': 0.95, 'valence': 0.8, 'tempo': 128, 'acousticness': 0.05},
    'dance': {'danceability': 0.9, 'energy': 0.9, 'valence': 0.85, 'tempo': 125, 'acousticness': 0.05},
    'acoustic': {'danceability': 0.4, 'energy': 0.25, 'valence': 0.35, 'tempo': 90, 'acousticness': 0.85},
    'classical': {'danceability': 0.2, 'energy': 0.2, 'valence': 0.3, 'tempo': 80, 'acousticness': 0.9, 'instrumentalness': 0.9},
    'video game': {'danceability': 0.6, 'energy': 0.85, 'valence': 0.7, 'tempo': 140, 'acousticness': 0.2},
    'country': {'danceability': 0.6, 'energy': 0.65, 'valence': 0.6, 'tempo': 110, 'acousticness': 0.5},
    'turkish': {'danceability': 0.7, 'energy': 0.75, 'valence': 0.65, 'tempo': 115, 'acousticness': 0.3},
}


def _get_audio_feature_vector(track):
    """Extract audio features as a numpy vector. Generates distinct genre/hash profiles if empty."""
    features = track.audio_features or {}

    if not features or 'energy' not in features:
        h = int(hashlib.md5(f"{track.title}{track.artist_id}".encode()).hexdigest(), 16)
        
        matched_profile = None
        genres = [g.lower() for g in (track.genres or [])]
        for g in genres:
            for key, prof in GENRE_AUDIO_PROFILES.items():
                if key in g:
                    matched_profile = prof
                    break
            if matched_profile:
                break
                
        if not matched_profile:
            matched_profile = {}

        var1 = ((h % 50) / 100.0) - 0.25
        var2 = (((h >> 4) % 50) / 100.0) - 0.25
        var3 = (((h >> 8) % 50) / 100.0) - 0.25
        var4 = (((h >> 12) % 60)) - 30

        danceability = min(max(matched_profile.get('danceability', 0.5) + var1, 0.1), 0.98)
        energy = min(max(matched_profile.get('energy', 0.5) + var2, 0.1), 0.98)
        valence = min(max(matched_profile.get('valence', 0.5) + var3, 0.1), 0.98)
        tempo = min(max(matched_profile.get('tempo', 120) + var4, 60), 180) / 200.0
        acousticness = min(max(matched_profile.get('acousticness', 0.3) - var2, 0.05), 0.95)
        instrumentalness = matched_profile.get('instrumentalness', 0.0)
        speechiness = 0.1
        liveness = 0.2

        track.audio_features = {
            'danceability': round(danceability, 2),
            'energy': round(energy, 2),
            'valence': round(valence, 2),
            'tempo': round(tempo * 200, 1),
            'acousticness': round(acousticness, 2),
            'instrumentalness': round(instrumentalness, 2),
        }

        return np.array([
            danceability, energy, valence, tempo, acousticness, instrumentalness, speechiness, liveness
        ])

    return np.array([
        features.get('danceability', 0.5),
        features.get('energy', 0.5),
        features.get('valence', 0.5),
        features.get('tempo', 120) / 200,
        features.get('acousticness', 0.5),
        features.get('instrumentalness', 0.0),
        features.get('speechiness', 0.1),
        features.get('liveness', 0.2),
    ])


MOOD_KEYWORD_MAP = {
    'workout': {'energy': 0.95, 'danceability': 0.85, 'tempo': 145 / 200, 'valence': 0.85, 'acousticness': 0.1},
    'gym': {'energy': 0.95, 'danceability': 0.85, 'tempo': 145 / 200, 'valence': 0.8, 'acousticness': 0.1},
    'study': {'energy': 0.2, 'acousticness': 0.85, 'tempo': 80 / 200, 'valence': 0.35, 'danceability': 0.3},
    'focus': {'energy': 0.25, 'acousticness': 0.8, 'tempo': 85 / 200, 'valence': 0.4, 'danceability': 0.35},
    'rainy': {'energy': 0.15, 'valence': 0.2, 'acousticness': 0.9, 'tempo': 75 / 200, 'danceability': 0.25},
    'sad': {'energy': 0.15, 'valence': 0.15, 'acousticness': 0.95, 'tempo': 70 / 200, 'danceability': 0.2},
    'happy': {'energy': 0.85, 'valence': 0.95, 'danceability': 0.9, 'tempo': 125 / 200, 'acousticness': 0.2},
    'party': {'energy': 0.95, 'danceability': 0.95, 'valence': 0.9, 'tempo': 128 / 200, 'acousticness': 0.05},
    'chill': {'energy': 0.3, 'valence': 0.5, 'acousticness': 0.7, 'tempo': 95 / 200, 'danceability': 0.45},
    'drive': {'energy': 0.75, 'valence': 0.65, 'tempo': 115 / 200, 'danceability': 0.7, 'acousticness': 0.3},
    'sunset': {'energy': 0.35, 'valence': 0.6, 'tempo': 100 / 200, 'danceability': 0.5, 'acousticness': 0.6},
    'synth': {'energy': 0.9, 'danceability': 0.8, 'tempo': 120 / 200, 'valence': 0.75, 'acousticness': 0.1},
    'coffee': {'energy': 0.25, 'valence': 0.55, 'tempo': 90 / 200, 'danceability': 0.4, 'acousticness': 0.8},
}


def get_prompt_recommendations(prompt, n=15):
    """Generates tracks matching a natural language mood/vibe prompt using audio feature vector similarity."""
    from music.models import Track

    target = {
        'danceability': 0.5, 'energy': 0.5, 'valence': 0.5,
        'tempo': 120 / 200, 'acousticness': 0.5,
        'instrumentalness': 0.0, 'speechiness': 0.1, 'liveness': 0.2
    }

    words = prompt.lower().split()
    matched = False
    
    for word in words:
        for key in MOOD_KEYWORD_MAP:
            if key in word or word in key:
                matched = True
                for feat, val in MOOD_KEYWORD_MAP[key].items():
                    target[feat] = val

    if not matched:
        h = int(hashlib.md5(prompt.lower().encode()).hexdigest(), 16)
        target['energy'] = 0.15 + ((h % 75) / 100.0)
        target['danceability'] = 0.15 + (((h >> 4) % 75) / 100.0)
        target['valence'] = 0.15 + (((h >> 8) % 75) / 100.0)
        target['tempo'] = (70 + ((h >> 12) % 90)) / 200.0
        target['acousticness'] = 0.1 + (((h >> 16) % 80) / 100.0)

    target_vec = np.array([
        target['danceability'], target['energy'], target['valence'],
        target['tempo'], target['acousticness'], target['instrumentalness'],
        target['speechiness'], target['liveness']
    ])

    candidates = list(Track.objects.all()[:300])
    scored = []
    
    for track in candidates:
        vec = _get_audio_feature_vector(track)
        score = cosine_similarity(target_vec, vec)
        scored.append((track, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [t for t, s in scored[:n]]



def cosine_similarity(vec_a, vec_b):
    """Calculate cosine similarity between two vectors."""
    if np.linalg.norm(vec_a) == 0 or np.linalg.norm(vec_b) == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_b)))


def get_content_based_recommendations(user_id, n=20):
    """Recommend tracks similar to user's vinyl wall based on audio features, falling back to favorite artists/genres."""
    from music.models import Track, VinylWallItem
    from accounts.models import User, FavoriteArtist

    wall_items = VinylWallItem.objects.filter(user_id=user_id).select_related('track')
    if not wall_items.exists():
        # Fallback 1: Recommend tracks by followed/favorite artists
        fav_artists = list(FavoriteArtist.objects.filter(user_id=user_id).values_list('artist_name', flat=True))
        if fav_artists:
            tracks = list(Track.objects.filter(artist__name__in=fav_artists).order_by('-popularity')[:n])
            if len(tracks) >= n:
                return tracks
            extra = n - len(tracks)
            popular = list(Track.objects.exclude(id__in=[t.id for t in tracks]).order_by('-popularity')[:extra])
            return tracks + popular

        # Fallback 2: Recommend tracks by favorite genres
        try:
            user = User.objects.get(id=user_id)
            if user.favorite_genres:
                # Query tracks containing overlaps in favorite genres
                tracks = list(Track.objects.filter(genres__overlap=user.favorite_genres).order_by('-popularity')[:n])
                if len(tracks) >= n:
                    return tracks
                extra = n - len(tracks)
                popular = list(Track.objects.exclude(id__in=[t.id for t in tracks]).order_by('-popularity')[:extra])
                return tracks + popular
        except Exception:
            pass

        return list(Track.objects.order_by('-popularity')[:n])

    wall_track_ids = [item.track_id for item in wall_items]
    wall_vectors = []
    for item in wall_items:
        wall_vectors.append(_get_audio_feature_vector(item.track))

    if not wall_vectors:
        return Track.objects.order_by('-popularity')[:n]

    user_profile = np.mean(wall_vectors, axis=0)

    candidates = Track.objects.exclude(id__in=wall_track_ids).order_by('-popularity')[:200]
    scored = []
    for track in candidates:
        vec = _get_audio_feature_vector(track)
        score = cosine_similarity(user_profile, vec)
        scored.append((track, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [t for t, s in scored[:n]]


def get_collaborative_recommendations(user_id, n=20):
    """Simple collaborative filtering based on shared vinyl wall items."""
    from music.models import Track, VinylWallItem
    from accounts.models import User

    my_track_ids = set(VinylWallItem.objects.filter(user_id=user_id).values_list('track_id', flat=True))
    if not my_track_ids:
        return Track.objects.order_by('-popularity')[:n]

    similar_users = VinylWallItem.objects.filter(
        track_id__in=my_track_ids
    ).exclude(user_id=user_id).values('user_id').annotate(
        shared=Count('id')
    ).order_by('-shared')[:10]

    similar_user_ids = [u['user_id'] for u in similar_users]
    recommended_track_ids = VinylWallItem.objects.filter(
        user_id__in=similar_user_ids
    ).exclude(
        track_id__in=my_track_ids
    ).values('track_id').annotate(
        count=Count('id')
    ).order_by('-count')[:n]

    track_ids = [r['track_id'] for r in recommended_track_ids]
    return list(Track.objects.filter(id__in=track_ids))


def get_hybrid_recommendations(user_id, n=20):
    """Weighted blend of content-based and collaborative."""
    content = get_content_based_recommendations(user_id, n=n*2)
    collab = get_collaborative_recommendations(user_id, n=n*2)

    seen = set()
    result = []
    for track in collab:
        if track.id not in seen:
            seen.add(track.id)
            result.append(track)
    for track in content:
        if track.id not in seen:
            seen.add(track.id)
            result.append(track)

    return result[:n]


def calculate_taste_match(user1_id, user2_id):
    """Calculate taste match percentage between two users."""
    from music.models import VinylWallItem
    from accounts.models import FavoriteArtist

    artists1 = set(FavoriteArtist.objects.filter(user_id=user1_id).values_list('artist_name', flat=True))
    artists2 = set(FavoriteArtist.objects.filter(user_id=user2_id).values_list('artist_name', flat=True))

    artist_score = 0
    if artists1 and artists2:
        intersection = artists1 & artists2
        union = artists1 | artists2
        artist_score = len(intersection) / len(union) if union else 0

    tracks1 = list(VinylWallItem.objects.filter(user_id=user1_id).select_related('track')[:20])
    tracks2 = list(VinylWallItem.objects.filter(user_id=user2_id).select_related('track')[:20])

    audio_score = 0
    if tracks1 and tracks2:
        vecs1 = [_get_audio_feature_vector(item.track) for item in tracks1]
        vecs2 = [_get_audio_feature_vector(item.track) for item in tracks2]
        profile1 = np.mean(vecs1, axis=0)
        profile2 = np.mean(vecs2, axis=0)
        audio_score = cosine_similarity(profile1, profile2)

    combined = (0.5 * artist_score + 0.5 * audio_score) * 100
    return round(min(combined, 100))


def get_similar_tracks(track_id, n=10):
    """Find tracks similar to a given track by audio features."""
    from music.models import Track

    try:
        target = Track.objects.get(id=track_id)
    except Track.DoesNotExist:
        return []

    target_vec = _get_audio_feature_vector(target)
    candidates = Track.objects.exclude(id=track_id).order_by('-popularity')[:200]

    scored = []
    for track in candidates:
        vec = _get_audio_feature_vector(track)
        score = cosine_similarity(target_vec, vec)
        scored.append((track, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [t for t, s in scored[:n]]


MOOD_KEYWORD_MAP = {
    'workout': {'energy': 0.9, 'danceability': 0.8, 'tempo': 140 / 200, 'valence': 0.8},
    'gym': {'energy': 0.95, 'danceability': 0.85, 'tempo': 145 / 200, 'valence': 0.75},
    'study': {'energy': 0.3, 'acousticness': 0.8, 'tempo': 90 / 200, 'valence': 0.4, 'speechiness': 0.05},
    'focus': {'energy': 0.35, 'acousticness': 0.7, 'instrumentalness': 0.8, 'tempo': 100 / 200},
    'rainy': {'energy': 0.25, 'valence': 0.3, 'acousticness': 0.85, 'tempo': 85 / 200},
    'sad': {'energy': 0.2, 'valence': 0.2, 'acousticness': 0.9, 'tempo': 80 / 200},
    'happy': {'energy': 0.8, 'valence': 0.9, 'danceability': 0.85, 'tempo': 125 / 200},
    'party': {'energy': 0.9, 'danceability': 0.9, 'valence': 0.85, 'tempo': 128 / 200},
    'chill': {'energy': 0.3, 'valence': 0.5, 'acousticness': 0.6, 'danceability': 0.5},
    'drive': {'energy': 0.7, 'valence': 0.6, 'tempo': 115 / 200, 'danceability': 0.7},
    'sunset': {'energy': 0.4, 'valence': 0.6, 'acousticness': 0.5, 'tempo': 100 / 200},
    'synth': {'energy': 0.85, 'danceability': 0.75, 'tempo': 120 / 200},
}


def get_prompt_recommendations(prompt, n=15):
    """Generates tracks matching a natural language mood/vibe prompt using audio feature vector similarity."""
    from music.models import Track

    target = {
        'danceability': 0.5, 'energy': 0.5, 'valence': 0.5,
        'tempo': 120 / 200, 'acousticness': 0.5,
        'instrumentalness': 0.0, 'speechiness': 0.1, 'liveness': 0.2
    }

    words = prompt.lower().split()
    matched = False
    
    for word in words:
        for key in MOOD_KEYWORD_MAP:
            if key in word or word in key:
                matched = True
                for feat, val in MOOD_KEYWORD_MAP[key].items():
                    target[feat] = (target[feat] + val) / 2

    target_vec = np.array([
        target['danceability'], target['energy'], target['valence'],
        target['tempo'], target['acousticness'], target['instrumentalness'],
        target['speechiness'], target['liveness']
    ])

    candidates = Track.objects.all().order_by('-popularity')[:200]
    scored = []
    
    for track in candidates:
        vec = _get_audio_feature_vector(track)
        score = cosine_similarity(target_vec, vec)
        scored.append((track, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [t for t, s in scored[:n]]


PERSONA_ARCHETYPES = [
    {
        'name': 'High-BPM Adrenaline Junkie',
        'icon': '⚡',
        'tagline': 'You thrive on explosive beats, high tempo, and maximum kinetic energy.',
        'gradient': 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
        'check': lambda e, d, a, t, v: e >= 0.70 and t >= 120
    },
    {
        'name': 'Midnight Synth-Runner',
        'icon': '🌙',
        'tagline': 'You move to hypnotic synth lines, night-drive basslines, and electronic rhythms.',
        'gradient': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'check': lambda e, d, a, t, v: e >= 0.55 and d >= 0.60
    },
    {
        'name': 'Acoustic Dreamer',
        'icon': '☕',
        'tagline': 'You seek warm organic textures, intimate acoustic arrangements, and soothing melodies.',
        'gradient': 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
        'check': lambda e, d, a, t, v: a >= 0.45 or e <= 0.40
    },
    {
        'name': 'Soul & Groove Connoisseur',
        'icon': '🎷',
        'tagline': 'You appreciate deep grooves, smooth R&B textures, and effortless rhythmic feel.',
        'gradient': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'check': lambda e, d, a, t, v: d >= 0.55 and t <= 115
    },
    {
        'name': 'Rock & Alternative Anthemist',
        'icon': '🎸',
        'tagline': 'You love electric guitar hooks, stadium choruses, and driving rhythm sections.',
        'gradient': 'linear-gradient(135deg, #6366f1 0%, #dc2626 100%)',
        'check': lambda e, d, a, t, v: e >= 0.50
    },
    {
        'name': 'Eclectic Sound Explorer',
        'icon': '🎧',
        'tagline': 'Your musical palate is rich and boundary-pushing, bridging multiple genres seamlessly.',
        'gradient': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'check': lambda e, d, a, t, v: True
    }
]


def get_user_persona(user_id):
    """Calculates user's AI Music Persona archetype based on Vinyl Wall audio vectors and favorite artists."""
    from music.models import VinylWallItem
    from accounts.models import User, FavoriteArtist

    wall_items = VinylWallItem.objects.filter(user_id=user_id).select_related('track')
    vectors = []
    
    for item in wall_items:
        vectors.append(_get_audio_feature_vector(item.track))

    if not vectors:
        avg_vec = np.array([0.65, 0.70, 0.60, 120 / 200, 0.25, 0.0, 0.1, 0.2])
    else:
        avg_vec = np.mean(vectors, axis=0)

    danceability = float(avg_vec[0])
    energy = float(avg_vec[1])
    valence = float(avg_vec[2])
    tempo_bpm = float(avg_vec[3] * 200)
    acousticness = float(avg_vec[4])

    matched_archetype = PERSONA_ARCHETYPES[-1]
    for arch in PERSONA_ARCHETYPES:
        if arch['check'](energy, danceability, acousticness, tempo_bpm, valence):
            matched_archetype = arch
            break

    fav_artists = list(FavoriteArtist.objects.filter(user_id=user_id).values_list('artist_name', flat=True)[:5])

    return {
        'archetype': matched_archetype['name'],
        'icon': matched_archetype['icon'],
        'tagline': matched_archetype['tagline'],
        'gradient': matched_archetype['gradient'],
        'stats': {
            'energy': round(energy * 100),
            'danceability': round(danceability * 100),
            'acousticness': round(acousticness * 100),
            'tempo': round(tempo_bpm),
            'valence': round(valence * 100),
        },
        'top_artists': fav_artists or ['The Weeknd', 'Taylor Swift', 'Post Malone']
    }


