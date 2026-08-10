from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

from .models import User, FavoriteArtist, Follow, Notification, Block
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, UserMiniSerializer,
    ProfileUpdateSerializer, FavoriteArtistSerializer, NotificationSerializer,
)


class RegisterView(APIView):
    """POST /api/auth/register/ - Create new account."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login/ - Authenticate and return JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ProfileView(APIView):
    """GET/PUT /api/auth/profile/ - Own profile."""

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)


class PublicProfileView(APIView):
    """GET /api/auth/profile/<username>/ - Any user's profile by ID or username."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = None
        if (username == 'me' or username == 'own') and request.user.is_authenticated:
            user = request.user
        else:
            user = User.objects.filter(username__iexact=username).first()
            if not user and len(str(username)) == 24:
                try:
                    user = User.objects.filter(id=username).first()
                except Exception:
                    user = None

        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = UserSerializer(user, context={'request': request})
        data = serializer.data
        if request.user.is_authenticated:
            data['is_blocked'] = Block.objects.filter(blocker=request.user, blocked=user).exists()
        else:
            data['is_blocked'] = False
        return Response(data)


class FollowToggleView(APIView):
    """POST /api/auth/follow/<user_id>/ - Follow or unfollow by ID or username."""

    def post(self, request, user_id):
        target_user = User.objects.filter(username__iexact=user_id).first()
        if not target_user and len(str(user_id)) == 24:
            try:
                target_user = User.objects.filter(id=user_id).first()
            except Exception:
                target_user = None

        if not target_user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)



        follow, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        if not created:
            follow.delete()
            return Response({'status': 'unfollowed', 'is_following': False})

        # Create notification
        Notification.objects.create(
            user=target_user, from_user=request.user, notification_type='follow',
            title=f'{request.user.username} started following you',
        )

        # Create message/friend request from follower to following
        try:
            from chat.models import MessageRequest
            MessageRequest.objects.get_or_create(
                from_user=request.user,
                to_user=target_user,
                defaults={'status': 'pending'}
            )
        except Exception:
            pass

        return Response({'status': 'followed', 'is_following': True}, status=status.HTTP_201_CREATED)


class BlockToggleView(APIView):
    """POST /api/auth/block/<str:user_id>/ - Block or unblock a user."""

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'Cannot block yourself'}, status=status.HTTP_400_BAD_REQUEST)

        block, created = Block.objects.get_or_create(blocker=request.user, blocked=target_user)
        if not created:
            block.delete()
            return Response({'status': 'unblocked', 'is_blocked': False})

        # Remove any mutual follow relationships upon blocking
        Follow.objects.filter(
            Q(follower=request.user, following=target_user) | 
            Q(follower=target_user, following=request.user)
        ).delete()

        return Response({'status': 'blocked', 'is_blocked': True}, status=status.HTTP_201_CREATED)


class BlockedUsersListView(APIView):
    """GET /api/auth/blocked-users/ - Retrieve blocked users list."""

    def get(self, request):
        blocks = Block.objects.filter(blocker=request.user).select_related('blocked')
        blocked_users = [b.blocked for b in blocks]
        serializer = UserSerializer(blocked_users, many=True, context={'request': request})
        return Response(serializer.data)


class UserSearchView(APIView):
    """GET /api/auth/search/?q=query - Search users."""

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        users = User.objects.filter(
            Q(username__icontains=query) | Q(city__icontains=query)
        ).exclude(id=request.user.id)[:20]
        serializer = UserMiniSerializer(users, many=True)
        return Response(serializer.data)


class NotificationListView(APIView):
    """GET /api/auth/notifications/ - User's notifications."""

    def get(self, request):
        notifications = request.user.notifications.all()[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    """POST /api/auth/notifications/<id>/read/"""

    def post(self, request, notification_id):
        try:
            notification = request.user.notifications.get(id=notification_id)
            notification.is_read = True
            notification.save()
            return Response({'status': 'read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllNotificationsReadView(APIView):
    """POST /api/auth/notifications/read-all/"""

    def post(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({'status': 'all_read'})


class UnreadCountView(APIView):
    """GET /api/auth/notifications/unread-count/"""

    def get(self, request):
        count = request.user.notifications.filter(is_read=False).count()
        
        # Compute total unread chats count (DMs + room memberships)
        try:
            from chat.models import DirectMessage, RoomMembership
            unread_dms = DirectMessage.objects.filter(receiver=request.user, is_read=False).count()
            unread_room_msgs = sum(m.unread_count for m in RoomMembership.objects.filter(user=request.user))
            chats_count = unread_dms + unread_room_msgs
        except Exception:
            chats_count = 0
            
        return Response({
            'count': count,
            'chats_count': chats_count
        })


class DeleteAccountView(APIView):
    """POST /api/auth/profile/delete/"""

    def post(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(password):
            return Response({'error': 'Incorrect password'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete user account
        request.user.delete()
        return Response({'status': 'deleted'})


class DiscoverUsersView(APIView):
    """GET /api/auth/discover/ - Users for community discovery (Tinder-like)."""

    def get(self, request):
        # Get users not already follo        # Discover candidates: exclude self
        following_ids = list(Follow.objects.filter(follower=request.user).values_list('following_id', flat=True))
        
        users_qs = User.objects.exclude(
            Q(id=request.user.id) | Q(id__in=following_ids)
        )

        if not users_qs.exists():
            # If all users followed or empty, show all other users so suggestions never disappear
            users_qs = User.objects.exclude(id=request.user.id)

        # Gender matches based on dating/matching preferences
        gender_pref = getattr(request.user, 'gender_preference', 'Both')
        user_gender = getattr(request.user, 'gender', 'Male')
        
        if gender_pref != 'Both':
            users_qs = users_qs.filter(gender=gender_pref)
            
        users_qs = users_qs.filter(Q(gender_preference='Both') | Q(gender_preference=user_gender))
        
        users = list(users_qs.order_by('?')[:15])

        result = []
        for user in users:
            data = UserSerializer(user, context={'request': request}).data
            result.append(data)

        return Response(result)



class FavoriteArtistView(APIView):
    """GET/POST/DELETE /api/auth/favorite-artists/"""

    def get(self, request):
        artists = request.user.favorite_artists.all()
        serializer = FavoriteArtistSerializer(artists, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FavoriteArtistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        fav_artist = serializer.save(user=request.user)
        
        # Auto-join artist chatroom
        try:
            from chat.models import ChatRoom, RoomMembership
            from music.models import Artist
            artist_name = serializer.validated_data.get('artist_name')
            
            # Find or create artist record
            artist, _ = Artist.objects.get_or_create(
                name=artist_name,
                defaults={
                    'image_url': serializer.validated_data.get('artist_image_url', ''),
                    'spotify_id': serializer.validated_data.get('spotify_id', '')
                }
            )
            # Find or create chatroom for this artist
            room, _ = ChatRoom.objects.get_or_create(
                room_type='artist',
                artist=artist,
                defaults={
                    'name': f"{artist.name} Chatroom",
                    'description': f"Official discussion room for {artist.name} fans.",
                    'cover_image_url': artist.image_url,
                }
            )
            # Join user to this room
            RoomMembership.objects.get_or_create(room=room, user=request.user)
        except Exception as e:
            print("Auto-join chatroom error:", e)
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        artist_id = request.data.get('id')
        try:
            artist = request.user.favorite_artists.get(id=artist_id)
            artist.delete()
            return Response({'status': 'removed'})
        except FavoriteArtist.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class BoostProfileView(APIView):
    """POST /api/auth/boost/ - Boost profile visibility."""

    def post(self, request):
        request.user.is_boosted = True
        request.user.boost_expires_at = timezone.now() + timedelta(hours=24)
        request.user.save()
        return Response({'status': 'boosted', 'expires_at': request.user.boost_expires_at})


class UserFollowersView(APIView):
    """GET /api/auth/profile/<username>/followers/ - Get followers of a user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        followers = [f.follower for f in user.followers_set.select_related('follower')]
        serializer = UserMiniSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)


class UserFollowingView(APIView):
    """GET /api/auth/profile/<username>/following/ - Get users followed by a user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        following = [f.following for f in user.following_set.select_related('following')]
        serializer = UserMiniSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)
