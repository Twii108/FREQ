from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, FavoriteArtist, Follow, Notification
from freq_backend.utils import wrap_cors_proxy


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    favorite_genres = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'age', 'gender', 'gender_preference', 'city', 'country', 'country_flag', 'favorite_genres']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken. Please choose another one.")
        return value

    def validate_age(self, value):
        if value is not None and value < 18:
            raise serializers.ValidationError("You must be 18 or older to register.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            age=validated_data.get('age'),
            gender=validated_data.get('gender', 'Male'),
            gender_preference=validated_data.get('gender_preference', 'Both'),
            city=validated_data.get('city', ''),
            country=validated_data.get('country', ''),
            country_flag=validated_data.get('country_flag', ''),
            favorite_genres=validated_data.get('favorite_genres', []),
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('Account disabled')
        data['user'] = user
        return data


class FavoriteArtistSerializer(serializers.ModelSerializer):
    artist_image_url = serializers.SerializerMethodField()

    class Meta:
        model = FavoriteArtist
        fields = ['id', 'artist_name', 'artist_image_url', 'spotify_id', 'added_at']
        read_only_fields = ['id', 'added_at']

    def get_artist_image_url(self, obj):
        return wrap_cors_proxy(obj.artist_image_url)


class UserMiniSerializer(serializers.ModelSerializer):
    """Lightweight user serializer for lists and embeds."""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_url', 'is_verified', 'country_flag']

    def get_avatar_url(self, obj):
        return wrap_cors_proxy(obj.avatar_url)


class UserSerializer(serializers.ModelSerializer):
    """Full user profile serializer."""
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    favorite_artists = FavoriteArtistSerializer(many=True, read_only=True)
    badges_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    taste_match = serializers.SerializerMethodField()
    favorite_song_detail = serializers.SerializerMethodField()
    favorite_song = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    background_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'bio', 'avatar_url', 'background_url', 'age', 'gender', 'gender_preference', 'city',
            'country', 'country_flag', 'status_text', 'is_verified', 'is_boosted',
            'favorite_genres', 'listening_stats', 'followers_count', 'following_count',
            'favorite_artists', 'badges_count', 'is_following', 'taste_match',
            'favorite_song', 'favorite_song_detail', 'music_prompts',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified']

    def get_avatar_url(self, obj):
        return wrap_cors_proxy(obj.avatar_url)

    def get_background_url(self, obj):
        return wrap_cors_proxy(obj.background_url)

    def get_favorite_song(self, obj):
        if obj.favorite_song_id:
            return str(obj.favorite_song_id)
        return None

    def get_favorite_song_detail(self, obj):
        if obj.favorite_song:
            from music.serializers import TrackSerializer
            return TrackSerializer(obj.favorite_song, context=self.context).data
        return None

    def get_badges_count(self, obj):
        if hasattr(obj, 'badges'):
            return obj.badges.count()
        return 0

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_taste_match(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            try:
                # 1. Favorite Artists Intersection (40% weight)
                my_artists = set(request.user.favorite_artists.values_list('artist_name', flat=True))
                their_artists = set(obj.favorite_artists.values_list('artist_name', flat=True))
                
                artist_score = 0
                if my_artists or their_artists:
                    shared_artists = my_artists & their_artists
                    union_artists = my_artists | their_artists
                    artist_score = (len(shared_artists) / max(1, len(union_artists))) * 40

                # 2. Favorite Genres Intersection (40% weight)
                my_genres = set(request.user.favorite_genres or [])
                their_genres = set(obj.favorite_genres or [])
                
                genre_score = 0
                if my_genres or their_genres:
                    shared_genres = my_genres & their_genres
                    union_genres = my_genres | their_genres
                    genre_score = (len(shared_genres) / max(1, len(union_genres))) * 40

                # 3. Listening Activity Genre Intersection (20% weight)
                listened_score = 0
                try:
                    from social.models import ListeningActivity
                    my_activities = ListeningActivity.objects.filter(user=request.user).select_related('track')
                    their_activities = ListeningActivity.objects.filter(user=obj).select_related('track')
                    
                    my_listened_genres = set()
                    for act in my_activities:
                        if act.track and act.track.genres:
                            my_listened_genres.update(act.track.genres)
                            
                    their_listened_genres = set()
                    for act in their_activities:
                        if act.track and act.track.genres:
                            their_listened_genres.update(act.track.genres)
                            
                    if my_listened_genres or their_listened_genres:
                        shared_listened = my_listened_genres & their_listened_genres
                        union_listened = my_listened_genres | their_listened_genres
                        listened_score = (len(shared_listened) / max(1, len(union_listened))) * 20
                except Exception:
                    pass

                total_score = round(artist_score + genre_score + listened_score)
                
                if total_score == 0:
                    # Provide a stable, realistic matching base percentage based on username hashes
                    stable_val = (sum(ord(c) for c in request.user.username) + sum(ord(c) for c in obj.username))
                    total_score = (stable_val % 25) + 60
                
                return total_score
            except Exception:
                return 75
        return None


class ProfileUpdateSerializer(serializers.ModelSerializer):
    favorite_song_id = serializers.CharField(source='favorite_song', required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['bio', 'avatar_url', 'background_url', 'age', 'gender', 'gender_preference', 'city', 'country', 'country_flag',
                  'status_text', 'favorite_genres', 'favorite_song_id', 'music_prompts']

    def update(self, instance, validated_data):
        fav_song_val = validated_data.pop('favorite_song', None)
        if fav_song_val is not None:
            from music.models import Track
            try:
                instance.favorite_song = Track.objects.get(id=fav_song_val)
            except (Track.DoesNotExist, ValueError, TypeError):
                instance.favorite_song = None
        return super().update(instance, validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    from_user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'from_user', 'notification_type', 'title', 'body', 'is_read', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']
