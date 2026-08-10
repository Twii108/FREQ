from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from music.serializers import TrackSerializer
from .engine import (
    get_hybrid_recommendations,
    get_similar_tracks,
    calculate_taste_match,
    get_prompt_recommendations,
    get_user_persona
)
from accounts.models import User




class ForYouView(APIView):
    """GET /api/recommendations/for-you/"""

    def get(self, request):
        tracks = get_hybrid_recommendations(request.user.id, n=20)
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)


class SimilarTracksView(APIView):
    """GET /api/recommendations/similar/<track_id>/"""

    def get(self, request, track_id):
        tracks = get_similar_tracks(track_id, n=10)
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)


class TasteMatchView(APIView):
    """GET /api/recommendations/taste-match/<user_id>/"""

    def get(self, request, user_id):
        match_pct = calculate_taste_match(request.user.id, user_id)
        return Response({'match_percentage': match_pct})


from freq_backend.cache_utils import get_cached_data, set_cached_data

class UserPersonaView(APIView):
    """GET /api/recommendations/persona/<username>/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, username=None):
        user_id = None
        target_username = username
        if username:
            try:
                user = User.objects.get(username=username)
                user_id = user.id
            except User.DoesNotExist:
                pass
        elif request.user and request.user.is_authenticated:
            user_id = request.user.id
            target_username = request.user.username

        cache_key = f"user_persona_{target_username or user_id or 'guest'}"
        cached_persona = get_cached_data(cache_key)
        if cached_persona:
            return Response(cached_persona)

        persona = get_user_persona(user_id)
        set_cached_data(cache_key, persona, timeout_seconds=300)
        return Response(persona)


class PromptMatchView(APIView):
    """GET /api/recommendations/prompt-match/?prompt=workout"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        prompt = request.query_params.get('prompt', 'chill study vibe')
        prompt_clean = prompt.strip().lower()
        cache_key = f"prompt_match_{hash(prompt_clean)}"
        
        cached_res = get_cached_data(cache_key)
        if cached_res:
            return Response(cached_res)

        tracks = get_prompt_recommendations(prompt, n=15)
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        res_data = {
            'prompt': prompt,
            'tracks': serializer.data
        }
        set_cached_data(cache_key, res_data, timeout_seconds=300)
        return Response(res_data)




