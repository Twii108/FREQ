from rest_framework import serializers
from .models import Post, Like, Comment, Repost, Bookmark, ListeningActivity, Concert, ConcertAttendance
from accounts.serializers import UserMiniSerializer
from music.serializers import TrackMiniSerializer, ArtistMiniSerializer


class CommentSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    track = TrackMiniSerializer(read_only=True)
    tagged_artist = ArtistMiniSerializer(read_only=True)
    likes_count = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    reposts_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    is_reposted = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    music_match = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'content', 'image_url', 'track', 'tagged_artist',
            'is_hot_take', 'rating', 'likes_count', 'comments_count', 'reposts_count',
            'is_liked', 'is_reposted', 'is_bookmarked', 'music_match', 'time_ago',
            'created_at',
        ]

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_is_reposted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Repost.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_music_match(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj.user:
            my_artists = set(request.user.favorite_artists.values_list('artist_name', flat=True))
            their_artists = set(obj.user.favorite_artists.values_list('artist_name', flat=True))
            if not my_artists or not their_artists:
                return None
            intersection = my_artists & their_artists
            union = my_artists | their_artists
            return round((len(intersection) / len(union)) * 100) if union else 0
        return None

    def get_time_ago(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.created_at
        if delta.days > 0:
            return f"{delta.days}d"
        hours = delta.seconds // 3600
        if hours > 0:
            return f"{hours}h"
        minutes = delta.seconds // 60
        return f"{minutes}m" if minutes > 0 else "now"


class PostCreateSerializer(serializers.ModelSerializer):
    content = serializers.CharField(required=False, allow_blank=True, default='')
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    track_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    tagged_artist_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Post
        fields = ['content', 'image_url', 'track_id', 'tagged_artist_id', 'is_hot_take', 'rating']


class ListeningActivitySerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    track = TrackMiniSerializer(read_only=True)

    class Meta:
        model = ListeningActivity
        fields = ['id', 'user', 'track', 'listened_at']


class ConcertSerializer(serializers.ModelSerializer):
    attendees_count = serializers.SerializerMethodField()
    attending_friends = serializers.SerializerMethodField()
    is_attending = serializers.SerializerMethodField()

    class Meta:
        model = Concert
        fields = '__all__'

    def get_attendees_count(self, obj):
        return obj.attendees.count()

    def get_attending_friends(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        
        user = request.user
        friends_ids = set(user.following_set.values_list('following_id', flat=True))
        
        attendances = obj.attendees.filter(user_id__in=friends_ids).select_related('user')[:5]
        return UserMiniSerializer([a.user for a in attendances], many=True).data

    def get_is_attending(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.attendees.filter(user=request.user).exists()


class ConcertAttendanceSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    concert = ConcertSerializer(read_only=True)

    class Meta:
        model = ConcertAttendance
        fields = '__all__'

