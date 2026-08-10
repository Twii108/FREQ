from django.db import models


class Artist(models.Model):
    """Music artist scraped from Spotify/Last.fm/MusicBrainz."""
    name = models.CharField(max_length=300)
    image_url = models.URLField(blank=True, default='')
    genres = models.JSONField(default=list, blank=True)
    spotify_id = models.CharField(max_length=100, unique=True)
    lastfm_url = models.URLField(blank=True, default='')
    bio = models.TextField(blank=True, default='')
    popularity = models.IntegerField(default=0)
    followers_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'artists'
        ordering = ['-popularity']

    def __str__(self):
        return self.name


class Track(models.Model):
    """Music track with Spotify audio features for ML."""
    title = models.CharField(max_length=500)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks')
    album_name = models.CharField(max_length=500, blank=True, default='')
    album_art_url = models.URLField(blank=True, default='')
    duration_ms = models.IntegerField(default=0)
    preview_url = models.URLField(blank=True, default='')
    spotify_id = models.CharField(max_length=100, unique=True)
    spotify_uri = models.CharField(max_length=200, blank=True, default='')
    popularity = models.IntegerField(default=0)
    audio_features = models.JSONField(default=dict, blank=True)
    genres = models.JSONField(default=list, blank=True)
    release_date = models.CharField(max_length=20, blank=True, default='')
    is_explicit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tracks'
        ordering = ['-popularity']

    def __str__(self):
        return f"{self.title} — {self.artist.name}"

    @property
    def duration_formatted(self):
        minutes = self.duration_ms // 60000
        seconds = (self.duration_ms % 60000) // 1000
        return f"{minutes}:{seconds:02d}"


class VinylWallItem(models.Model):
    """User's vinyl wall — curated grid of favorite tracks."""
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='vinyl_wall')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='vinyl_appearances')
    position = models.IntegerField(default=0)
    note = models.CharField(max_length=200, blank=True, default='')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vinyl_wall_items'
        unique_together = ('user', 'track')
        ordering = ['position']

    def __str__(self):
        return f"{self.user.username}: {self.track.title}"
