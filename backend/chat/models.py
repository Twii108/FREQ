from django.db import models


class ChatRoom(models.Model):
    """Artist-based or general chat rooms."""
    ROOM_TYPES = [('artist', 'Artist'), ('genre', 'Genre'), ('general', 'General')]
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='general')
    artist = models.ForeignKey('music.Artist', on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_rooms')
    cover_image_url = models.URLField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_rooms'

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.members.count()


class Message(models.Model):
    """Chat room message."""
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']


class DirectMessage(models.Model):
    """1-on-1 direct message."""
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_dms')
    receiver = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_dms')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'direct_messages'
        ordering = ['timestamp']


class MessageRequest(models.Model):
    """Message request before DM is accepted."""
    STATUS = [('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')]
    from_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_msg_requests')
    to_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_msg_requests')
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'message_requests'
        unique_together = ('from_user', 'to_user')


class RoomMembership(models.Model):
    """Tracks which users are in which rooms."""
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='room_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    unread_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'room_memberships'
        unique_together = ('room', 'user')
