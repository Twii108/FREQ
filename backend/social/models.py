from django.db import models


class Post(models.Model):
    """Social feed post — can include text, track card, image, artist tag."""
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image_url = models.TextField(blank=True, default='')
    track = models.ForeignKey('music.Track', on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    tagged_artist = models.ForeignKey('music.Artist', on_delete=models.SET_NULL, null=True, blank=True)
    is_hot_take = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    rating = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def reposts_count(self):
        return self.reposts.count()


class Like(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes'
        unique_together = ('user', 'post')


class Comment(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']


class Repost(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reposts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reposts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reposts'
        unique_together = ('user', 'post')


class Bookmark(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ('user', 'post')


class ListeningActivity(models.Model):
    """Tracks what users are listening to — powers the live feed."""
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='listening_activity')
    track = models.ForeignKey('music.Track', on_delete=models.CASCADE, related_name='listeners')
    duration_seconds = models.IntegerField(default=0)
    listened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listening_activity'
        ordering = ['-listened_at']


class Concert(models.Model):
    title = models.CharField(max_length=255)
    artist_name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    venue = models.CharField(max_length=200)
    date_time = models.DateTimeField()
    description = models.TextField(blank=True, default='')
    image_url = models.URLField(blank=True, default='')
    ticket_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'concerts'
        ordering = ['date_time']

    def __str__(self):
        return f"{self.title} in {self.city}"


class ConcertAttendance(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='concert_attendances')
    concert = models.ForeignKey(Concert, on_delete=models.CASCADE, related_name='attendees')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'concert_attendances'
        unique_together = ('user', 'concert')

    def __str__(self):
        return f"{self.user.username} attending {self.concert.title}"

class PrivateRoom(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='owned_rooms')
    name = models.CharField(max_length=255)
    current_track = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'private_rooms'

class RoomGuest(models.Model):
    room = models.ForeignKey(PrivateRoom, on_delete=models.CASCADE, related_name='guests')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'room_guests'
        unique_together = ('room', 'user')

class TrackRequest(models.Model):
    room = models.ForeignKey(PrivateRoom, on_delete=models.CASCADE, related_name='track_requests')
    requested_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    track_data = models.JSONField()
    status = models.CharField(max_length=20, default='pending') # pending, approved, denied
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'track_requests'
