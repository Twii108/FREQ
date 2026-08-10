import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


@database_sync_to_async
def get_user_from_token(token):
    if not token:
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()
    try:
        import base64
        import json
        from accounts.models import User
        # Decode the payload segment of the JWT (unverified payload read for channels context)
        payload_part = token.split('.')[1]
        payload_part += '=' * (4 - len(payload_part) % 4)
        payload = json.loads(base64.b64decode(payload_part).decode('utf-8'))
        user_id = payload.get('user_id') or payload.get('id')
        if not user_id:
            from django.contrib.auth.models import AnonymousUser
            return AnonymousUser()
        return User.objects.get(id=user_id)
    except Exception as e:
        print("JWT base64 decode exception:", e)
        from django.contrib.auth.models import AnonymousUser
        return AnonymousUser()


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for chat rooms."""

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Parse token from query string
        from urllib.parse import parse_qs
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        self.user = await get_user_from_token(token)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'user_join',
                'username': self.user.username,
                'avatar_url': self.user.avatar_url,
            })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'user_leave',
                'username': self.user.username,
            })

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')

        if not message.strip():
            return

        if self.user and self.user.is_authenticated:
            await self.save_message(message)
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'chat_message',
                'message': message,
                'username': self.user.username,
                'avatar_url': self.user.avatar_url,
                'user_id': str(self.user.id),
                'timestamp': timezone.now().isoformat(),
            })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'username': event['username'],
            'avatar_url': event.get('avatar_url', ''),
            'user_id': event.get('user_id', ''),
            'timestamp': event['timestamp'],
        }))

    async def user_join(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username'],
            'avatar_url': event.get('avatar_url', ''),
        }))

    async def user_leave(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username'],
        }))

    @database_sync_to_async
    def save_message(self, content):
        from .models import ChatRoom, Message
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            Message.objects.create(room=room, sender=self.user, content=content)
        except ChatRoom.DoesNotExist:
            pass


class DMConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for direct messages."""

    async def connect(self):
        self.other_user_id = self.scope['url_route']['kwargs']['user_id']
        
        # Parse token from query string
        from urllib.parse import parse_qs
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]
        
        self.user = await get_user_from_token(token)

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        user_ids = sorted([str(self.user.id), str(self.other_user_id)])
        self.dm_group_name = f'dm_{user_ids[0]}_{user_ids[1]}'

        await self.channel_layer.group_add(self.dm_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'dm_group_name'):
            await self.channel_layer.group_discard(self.dm_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')

        if not message.strip() or not self.user.is_authenticated:
            return

        dm_id = await self.save_dm(message)
        await self.channel_layer.group_send(self.dm_group_name, {
            'type': 'dm_message',
            'id': dm_id,
            'message': message,
            'sender_id': str(self.user.id),
            'username': self.user.username,
            'avatar_url': self.user.avatar_url,
            'timestamp': timezone.now().isoformat(),
        })

    async def dm_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'dm',
            'id': event.get('id', ''),
            'message': event['message'],
            'sender_id': event['sender_id'],
            'username': event['username'],
            'avatar_url': event.get('avatar_url', ''),
            'timestamp': event['timestamp'],
        }))

    @database_sync_to_async
    def save_dm(self, content):
        from .models import DirectMessage, Notification
        from accounts.models import User
        from .views import generate_ai_bot_reply
        import threading
        import time

        try:
            if User.objects.filter(id=self.other_user_id).exists():
                receiver = User.objects.get(id=self.other_user_id)
            else:
                receiver = User.objects.get(username=self.other_user_id)

            dm = DirectMessage.objects.create(sender=self.user, receiver=receiver, content=content)
            
            try:
                Notification.objects.create(
                    user=receiver, from_user=self.user, notification_type='message',
                    title=f'New message from {self.user.username}', body=content[:80],
                    link=f'/chat/{self.user.username}'
                )
            except Exception:
                pass

            # AI Chatbot response block removed

            return str(dm.id)
        except Exception as e:
            print("save_dm error:", e)
            return f"dm_{int(time.time()*1000)}"

