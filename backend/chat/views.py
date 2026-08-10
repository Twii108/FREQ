from rest_framework import status, permissions
from rest_framework.response import Response

from rest_framework.views import APIView
from django.db.models import Q, Max
from accounts.models import User, Notification
from .models import ChatRoom, Message, DirectMessage, MessageRequest, RoomMembership
from .serializers import ChatRoomSerializer, MessageSerializer, DirectMessageSerializer, MessageRequestSerializer


class ChatRoomListView(APIView):
    """GET /api/chat/rooms/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):

        q = request.query_params.get('q', '').strip()
        rooms = ChatRoom.objects.filter(is_active=True)
        if q:
            rooms = rooms.filter(name__icontains=q)
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)


class ChatRoomDetailView(APIView):
    """GET /api/chat/rooms/<id>/"""

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Clear unread count for this user in this room
        RoomMembership.objects.filter(room=room, user=request.user).update(unread_count=0)
        
        data = ChatRoomSerializer(room, context={'request': request}).data
        data['is_joined'] = RoomMembership.objects.filter(room=room, user=request.user).exists()
        messages = room.messages.select_related('sender').order_by('-timestamp')[:50]
        data['messages'] = MessageSerializer(reversed(list(messages)), many=True).data
        return Response(data)


class JoinRoomView(APIView):
    """POST /api/chat/rooms/<id>/join/"""

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        RoomMembership.objects.get_or_create(room=room, user=request.user)
        return Response({'status': 'joined'})


class LeaveRoomView(APIView):
    """POST /api/chat/rooms/<id>/leave/"""

    def post(self, request, room_id):
        RoomMembership.objects.filter(room_id=room_id, user=request.user).delete()
        return Response({'status': 'left'})


class SendRoomMessageView(APIView):
    """POST /api/chat/rooms/<room_id>/send/"""

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Empty message'}, status=status.HTTP_400_BAD_REQUEST)
        msg = Message.objects.create(room=room, sender=request.user, content=content)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class RoomMembersListView(APIView):
    """GET /api/chat/rooms/<room_id>/members/"""

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        
        memberships = RoomMembership.objects.filter(room=room).select_related('user')
        users = [m.user for m in memberships]
        
        from accounts.serializers import UserSerializer
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)


class DMListView(APIView):
    """GET /api/chat/dms/ - All DM conversations including followed contacts."""

    def get(self, request):
        from django.utils import timezone
        from accounts.models import Follow
        
        # Get users we have DM history with
        sent = DirectMessage.objects.filter(sender=request.user).values_list('receiver_id', flat=True)
        received = DirectMessage.objects.filter(receiver=request.user).values_list('sender_id', flat=True)
        history_user_ids = [str(uid) for uid in list(sent) + list(received) if uid]

        # Get users we follow
        following_ids = [str(uid) for uid in Follow.objects.filter(follower=request.user).values_list('following_id', flat=True) if uid]

        # Get users who follow us
        follower_ids = [str(uid) for uid in Follow.objects.filter(following=request.user).values_list('follower_id', flat=True) if uid]
        
        # Combine history, following, and followers
        user_ids = set(history_user_ids + following_ids + follower_ids)

        conversations = []
        for uid in user_ids:
            try:
                other_user = User.objects.get(id=uid)
            except Exception:
                continue
            
            # Query using model instances to avoid string vs ObjectId translation mismatches
            last_msg = DirectMessage.objects.filter(
                Q(sender=request.user, receiver=other_user) | Q(sender=other_user, receiver=request.user)
            ).order_by('-timestamp').first()
            
            unread = DirectMessage.objects.filter(sender=other_user, receiver=request.user, is_read=False).count()
            
            ts = last_msg.timestamp.isoformat() if last_msg else (timezone.now() - timezone.timedelta(days=365)).isoformat()
            
            conversations.append({
                'user': {'id': str(other_user.id), 'username': other_user.username, 'avatar_url': other_user.avatar_url, 'is_verified': other_user.is_verified},
                'last_message': last_msg.content[:50] if last_msg else 'Start a conversation!',
                'timestamp': ts,
                'unread_count': unread,
                'has_history': last_msg is not None,
            })
        
        # Sort so that chats with history appear first, and within them, the most recent ones first
        conversations.sort(key=lambda x: (x['has_history'], x['timestamp']), reverse=True)
        return Response(conversations)


class DMDetailView(APIView):
    """GET /api/chat/dms/<user_id>/"""

    def get(self, request, user_id):
        try:
            if User.objects.filter(id=user_id).exists():
                other_user = User.objects.get(id=user_id)
            else:
                other_user = User.objects.get(username=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        messages = DirectMessage.objects.filter(
            Q(sender=request.user, receiver=other_user) | Q(sender=other_user, receiver=request.user)
        ).select_related('sender', 'receiver').order_by('timestamp')[:100]
        
        DirectMessage.objects.filter(sender=other_user, receiver=request.user, is_read=False).update(is_read=True)
        return Response(DirectMessageSerializer(messages, many=True).data)


def generate_ai_bot_reply(bot_user, incoming_msg):
    username = bot_user.username.lower()

    if 'tanvi' in username:
        return f"Hey! OMG I was just listening to Taylor Swift & Arijit Singh! 💖 Loved your message '{incoming_msg}'. What's your favorite song right now?"
    elif 'alex' in username:
        return f"Yo! Late night synthwave & electronic vibes in the studio 🎧 Loved what you said: '{incoming_msg}'. Let's collaborate on some beats!"
    elif 'melody' in username:
        return f"Hey there! Currently sipping coffee and curating a lo-fi soul playlist ☕ You said '{incoming_msg}' - that's so real! What track are you playing?"
    elif 'rhythm' in username:
        return f"What's good bro! Hip-Hop drops are fire today 🎤 Agreed on '{incoming_msg}'! Are you bumping Kendrick or Travis right now?"
    elif 'sarah' in username:
        return f"Hey! Stargazing with indie acoustic tracks right now 🌿 '{incoming_msg}' sounds awesome! Have you checked out any folk tracks lately?"
    else:
        return f"Hey! Thanks for connecting on FREQ! 🎵 You mentioned '{incoming_msg}'. Loving our music taste match! What's your top song today?"


class SendDMView(APIView):
    """POST /api/chat/dms/<user_id>/"""

    def post(self, request, user_id):
        try:
            if User.objects.filter(id=user_id).exists():
                receiver = User.objects.get(id=user_id)
            else:
                receiver = User.objects.get(username=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Empty message'}, status=status.HTTP_400_BAD_REQUEST)
        
        dm = DirectMessage.objects.create(sender=request.user, receiver=receiver, content=content)
        
        # Trigger real-time Notification for receiver
        try:
            Notification.objects.create(
                user=receiver,
                from_user=request.user,
                notification_type='message',
                title=f'New message from {request.user.username}',
                body=content[:80],
                link=f'/chat/{request.user.id}'
            )
        except Exception as e:
            print("Error creating message notification:", e)

        # Trigger automatic AI Chatbot auto-reply if chatting with another user
        # (Auto-reply block removed)

        return Response(DirectMessageSerializer(dm).data, status=status.HTTP_201_CREATED)




class BlastMessageView(APIView):
    """POST /api/chat/blast/ - Send to multiple users."""

    def post(self, request):
        user_ids = request.data.get('user_ids', [])
        content = request.data.get('content', '').strip()
        if not content or not user_ids:
            return Response({'error': 'Content and user_ids required'}, status=status.HTTP_400_BAD_REQUEST)
        sent_count = 0
        for uid in user_ids:
            try:
                receiver = User.objects.get(id=uid)
                DirectMessage.objects.create(sender=request.user, receiver=receiver, content=content)
                Notification.objects.create(
                    user=receiver, from_user=request.user, notification_type='blast',
                    title=f'{request.user.username} sent you a blast',
                )
                sent_count += 1
            except User.DoesNotExist:
                continue
        return Response({'status': 'blasted', 'sent_count': sent_count})


class MessageRequestListView(APIView):
    """GET /api/chat/requests/"""

    def get(self, request):
        requests_qs = MessageRequest.objects.filter(to_user=request.user, status='pending').select_related('from_user')
        return Response(MessageRequestSerializer(requests_qs, many=True).data)


class AcceptRejectRequestView(APIView):
    """POST /api/chat/requests/<id>/"""

    def post(self, request, request_id):
        try:
            msg_request = MessageRequest.objects.get(id=request_id, to_user=request.user)
        except MessageRequest.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action', 'accept')
        if action == 'accept':
            msg_request.status = 'accepted'
            # Establish follow back
            try:
                from accounts.models import Follow
                Follow.objects.get_or_create(follower=request.user, following=msg_request.from_user)
            except Exception:
                pass
        else:
            msg_request.status = 'rejected'
        msg_request.save()
        return Response({'status': msg_request.status})
