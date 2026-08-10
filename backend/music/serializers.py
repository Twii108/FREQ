from rest_framework import serializers
from .models import Artist, Track, VinylWallItem
from accounts.serializers import UserMiniSerializer
from freq_backend.utils import wrap_cors_proxy


class ArtistSerializer(serializers.ModelSerializer):
    tracks_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = ['id', 'name', 'image_url', 'genres', 'spotify_id', 'bio', 'popularity', 'followers_count', 'tracks_count']



    def get_tracks_count(self, obj):
        return obj.tracks.count()

    def get_image_url(self, obj):
        return wrap_cors_proxy(obj.image_url)


class ArtistMiniSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = ['id', 'name', 'image_url', 'spotify_id']

    def get_image_url(self, obj):
        return wrap_cors_proxy(obj.image_url)


class TrackSerializer(serializers.ModelSerializer):
    artist = ArtistMiniSerializer(read_only=True)
    duration_formatted = serializers.ReadOnlyField()
    in_vinyl_wall = serializers.SerializerMethodField()
    album_art_url = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = [
            'id', 'title', 'artist', 'album_name', 'album_art_url', 'duration_ms',
            'duration_formatted', 'preview_url', 'spotify_id', 'spotify_uri',
            'popularity', 'audio_features', 'genres', 'release_date', 'is_explicit',
            'in_vinyl_wall',
        ]

    def get_album_art_url(self, obj):
        return wrap_cors_proxy(obj.album_art_url)

    def get_in_vinyl_wall(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VinylWallItem.objects.filter(user=request.user, track=obj).exists()
        return False


class TrackMiniSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    album_art_url = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = ['id', 'title', 'artist_name', 'album_art_url', 'preview_url', 'spotify_uri', 'is_explicit']

    def get_album_art_url(self, obj):
        return wrap_cors_proxy(obj.album_art_url)


class VinylWallItemSerializer(serializers.ModelSerializer):
    track = TrackSerializer(read_only=True)
    track_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = VinylWallItem
        fields = ['id', 'track', 'track_id', 'position', 'note', 'added_at']
        read_only_fields = ['id', 'added_at']
