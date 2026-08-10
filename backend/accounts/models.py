from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with music profile fields."""
    bio = models.TextField(blank=True, default='')
    avatar_url = models.TextField(blank=True, default='')  # Can hold URL or Base64 string
    background_url = models.TextField(blank=True, default='')  # Custom background header image (Base64)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, default='Male', choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    gender_preference = models.CharField(max_length=20, default='Both', choices=[('Male', 'Male'), ('Female', 'Female'), ('Both', 'Both')])
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    country_flag = models.CharField(max_length=10, blank=True, default='')
    status_text = models.CharField(max_length=200, blank=True, default="What's on your mind?")
    is_verified = models.BooleanField(default=False)
    is_boosted = models.BooleanField(default=False)
    boost_expires_at = models.DateTimeField(null=True, blank=True)
    favorite_genres = models.JSONField(default=list, blank=True)
    favorite_song = models.ForeignKey('music.Track', on_delete=models.SET_NULL, null=True, blank=True, related_name='favorited_by')
    music_prompts = models.JSONField(default=list, blank=True)
    listening_stats = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username

    @property
    def followers_count(self):
        return self.followers_set.count()

    @property
    def following_count(self):
        return self.following_set.count()


class FavoriteArtist(models.Model):
    """User's favorite artists - shown on profile, affects match %."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_artists')
    artist_name = models.CharField(max_length=200)
    artist_image_url = models.URLField(blank=True, default='')
    spotify_id = models.CharField(max_length=100, blank=True, default='')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorite_artists'
        unique_together = ('user', 'artist_name')

    def __str__(self):
        return f"{self.user.username} → {self.artist_name}"


class Follow(models.Model):
    """Social follow relationship."""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'follows'
        unique_together = ('follower', 'following')

    def __str__(self):
        return f"{self.follower.username} → {self.following.username}"


class Notification(models.Model):
    """User notifications for social interactions."""
    TYPES = [
        ('follow', 'Follow'),
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('repost', 'Repost'),
        ('message', 'Message'),
        ('badge', 'Badge'),
        ('blast', 'Blast'),
        ('concert_invite', 'Concert Invite'),
        ('concert_alert', 'Concert Alert'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPES)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default='')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class Block(models.Model):
    """Social block relationship."""
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking_set')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blocks'
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} ⊘ {self.blocked.username}"

