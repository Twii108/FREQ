from rest_framework import serializers
from .models import ChatRoom, Message, DirectMessage, MessageRequest, RoomMembership
from accounts.serializers import UserMiniSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp']


class ChatRoomSerializer(serializers.ModelSerializer):
    members_count = serializers.ReadOnlyField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'description', 'room_type', 'cover_image_url', 'is_active', 'members_count', 'unread_count', 'last_message', 'created_at']

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = RoomMembership.objects.get(room=obj, user=request.user)
                return membership.unread_count
            except RoomMembership.DoesNotExist:
                return 0
        return 0

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-timestamp').first()
        if msg:
            return {'content': msg.content[:50], 'sender': msg.sender.username, 'timestamp': msg.timestamp.isoformat()}
        return None


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserMiniSerializer(read_only=True)
    receiver = UserMiniSerializer(read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'sender', 'receiver', 'content', 'is_read', 'timestamp']


class MessageRequestSerializer(serializers.ModelSerializer):
    from_user = UserMiniSerializer(read_only=True)

    class Meta:
        model = MessageRequest
        fields = ['id', 'from_user', 'status', 'created_at']
