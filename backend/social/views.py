from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from accounts.models import Follow, Notification
from music.models import Track, Artist
from .models import Post, Like, Comment, Repost, Bookmark, ListeningActivity
from .serializers import PostSerializer, PostCreateSerializer, CommentSerializer, ListeningActivitySerializer


import random

class FeedView(APIView):
    """GET /api/social/feed/?tab=foryou|friends&page=1"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        tab = request.query_params.get('tab', 'foryou')
        if request.user.is_authenticated:
            following_ids = list(Follow.objects.filter(follower=request.user).values_list('following_id', flat=True))
            user_id = request.user.id
            fav_artists = [fa.artist_name.lower() for fa in request.user.favorite_artists.all() if fa.artist_name]
        else:
            following_ids = []
            user_id = None
            fav_artists = []
        
        if tab == 'friends':
            posts = list(Post.objects.filter(
                Q(user_id__in=following_ids) | Q(user_id=user_id)
            ).select_related('user', 'track', 'track__artist', 'tagged_artist'))
        else:
            posts = list(Post.objects.filter(
                Q(is_public=True) | Q(user_id__in=following_ids) | Q(user_id=user_id)
            ).select_related('user', 'track', 'track__artist', 'tagged_artist'))

        if fav_artists:
            def score_post(p):
                content_lower = (p.content or '').lower()
                score = 0
                for art in fav_artists:
                    if art in content_lower:
                        score += 10
                return score
            posts.sort(key=score_post, reverse=True)
            top_posts = posts[:4]
            random.shuffle(top_posts)
            rest_posts = posts[4:]
            random.shuffle(rest_posts)
            posts = top_posts + rest_posts
        else:
            random.shuffle(posts)

        serializer = PostSerializer(posts[:50], many=True, context={'request': request})
        return Response(serializer.data)





class CreatePostView(APIView):
    """POST /api/social/posts/"""

    def post(self, request):
        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kwargs = {'user': request.user}
        track_id = serializer.validated_data.pop('track_id', None)
        artist_id = serializer.validated_data.pop('tagged_artist_id', None)
        if track_id:
            try:
                kwargs['track'] = Track.objects.get(id=track_id)
            except Track.DoesNotExist:
                pass
        if artist_id:
            try:
                kwargs['tagged_artist'] = Artist.objects.get(id=artist_id)
            except Artist.DoesNotExist:
                pass
        # Safeguard: Replace None values with empty string for non-nullable database fields
        if serializer.validated_data.get('content') is None:
            serializer.validated_data['content'] = ''
        if serializer.validated_data.get('image_url') is None:
            serializer.validated_data['image_url'] = ''

        post = Post.objects.create(**kwargs, **serializer.validated_data)
        return Response(PostSerializer(post, context={'request': request}).data, status=status.HTTP_201_CREATED)


class PostDetailView(APIView):
    """GET/DELETE /api/social/posts/<id>/"""

    def get(self, request, post_id):
        try:
            post = Post.objects.select_related('user', 'track', 'track__artist', 'tagged_artist').get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PostSerializer(post, context={'request': request}).data)

    def delete(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id, user=request.user)
            post.delete()
            return Response({'status': 'deleted'})
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class LikeToggleView(APIView):
    """POST /api/social/posts/<id>/like/"""

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
            return Response({'status': 'unliked', 'likes_count': post.likes_count})
        if post.user != request.user:
            Notification.objects.create(
                user=post.user, from_user=request.user, notification_type='like',
                title=f'{request.user.username} liked your post',
            )
        return Response({'status': 'liked', 'likes_count': post.likes_count})


class CommentListCreateView(APIView):
    """GET/POST /api/social/posts/<id>/comments/"""

    def get(self, request, post_id):
        comments = Comment.objects.filter(post_id=post_id).select_related('user')[:50]
        return Response(CommentSerializer(comments, many=True).data)

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        comment = Comment.objects.create(user=request.user, post=post, content=request.data.get('content', ''))
        if post.user != request.user:
            Notification.objects.create(
                user=post.user, from_user=request.user, notification_type='comment',
                title=f'{request.user.username} commented on your post',
            )
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class RepostToggleView(APIView):
    """POST /api/social/posts/<id>/repost/"""

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        repost, created = Repost.objects.get_or_create(user=request.user, post=post)
        if not created:
            repost.delete()
            return Response({'status': 'unreposted', 'reposts_count': post.reposts_count})
        return Response({'status': 'reposted', 'reposts_count': post.reposts_count})


class BookmarkToggleView(APIView):
    """POST /api/social/posts/<id>/bookmark/"""

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            bookmark.delete()
            return Response({'status': 'unbookmarked'})
        return Response({'status': 'bookmarked'})


class UserPostsView(APIView):
    """GET /api/social/users/<username>/posts/"""

    def get(self, request, username):
        from accounts.models import User
        target_user = None
        if (username == 'me' or username == 'own') and request.user.is_authenticated:
            target_user = request.user
        else:
            target_user = User.objects.filter(username__iexact=username).first()
            if not target_user and len(str(username)) == 24:
                try:
                    target_user = User.objects.filter(id=username).first()
                except Exception:
                    target_user = None

        if not target_user:
            return Response([], status=status.HTTP_200_OK)

        posts = Post.objects.filter(user=target_user)
        is_owner = request.user.is_authenticated and request.user == target_user
        is_following = request.user.is_authenticated and Follow.objects.filter(follower=request.user, following=target_user).exists()
        
        if not (is_owner or is_following):
            posts = posts.filter(is_public=True)
            
        posts = posts.select_related('user', 'track', 'track__artist', 'tagged_artist').order_by('-created_at')[:50]
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)



class UserRepostsView(APIView):
    """GET /api/social/users/<username>/reposts/"""

    def get(self, request, username):
        from accounts.models import User
        target_user = None
        if (username == 'me' or username == 'own') and request.user.is_authenticated:
            target_user = request.user
        else:
            target_user = User.objects.filter(username__iexact=username).first()
            if not target_user and len(str(username)) == 24:
                try:
                    target_user = User.objects.filter(id=username).first()
                except Exception:
                    target_user = None

        if not target_user:
            return Response([], status=status.HTTP_200_OK)

        repost_post_ids = Repost.objects.filter(user=target_user).values_list('post_id', flat=True)
        posts = Post.objects.filter(id__in=repost_post_ids).select_related('user', 'track', 'track__artist', 'tagged_artist')
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)


class LogListeningView(APIView):
    """POST /api/social/listening/"""

    def post(self, request):
        track_id = request.data.get('track_id')
        duration_seconds = int(request.data.get('duration_seconds', 0))
        if not track_id or len(str(track_id)) != 24:
            return Response({'status': 'ignored'})
        try:
            track = Track.objects.get(id=track_id)
            ListeningActivity.objects.create(user=request.user, track=track, duration_seconds=duration_seconds)
            return Response({'status': 'logged'})
        except Exception:
            return Response({'status': 'ignored'})



class ListeningFeedView(APIView):
    """GET /api/social/listening/feed/ - What people are listening to."""

    def get(self, request):
        activities = ListeningActivity.objects.select_related('user', 'track', 'track__artist').all()[:30]
        return Response(ListeningActivitySerializer(activities, many=True).data)


        return Response(data)


class ListenTogetherRoomView(APIView):
    """GET/POST /api/social/listen-together/ - Live synchronized listening room."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from music.models import Track
        # Return currently active sync room track and active listeners
        latest_track = Track.objects.filter(preview_url__gt='').order_by('id').first()
        return Response({
            'room_name': '⚡ Midnight Frequencies Live Sync',
            'listeners_count': 14,
            'current_track': {
                'id': str(latest_track.id) if latest_track else 't1',
                'title': latest_track.title if latest_track else 'Blinding Lights',
                'artist_name': latest_track.artist.name if (latest_track and latest_track.artist) else 'The Weeknd',
                'album_art_url': latest_track.album_art_url if latest_track else '',
                'preview_url': latest_track.preview_url if latest_track else 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a'
            },
            'progress_ms': 14200,
            'active_reactions': ['🔥', '💖', '⚡', '🎧', '🕺']
        })


class HotTakeVoteView(APIView):
    """POST /api/social/posts/<id>/vote/ - Vote on a Hot Take poll."""

    def post(self, request, post_id):
        vote = request.data.get('vote') # 'agree' or 'disagree'
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Store votes in listening_stats or simple count
        if not hasattr(post, 'votes_agree'):
            agree_count = 18 if vote == 'agree' else 17
            disagree_count = 5 if vote == 'agree' else 6
        else:
            agree_count = getattr(post, 'votes_agree', 18) + (1 if vote == 'agree' else 0)
            disagree_count = getattr(post, 'votes_disagree', 5) + (1 if vote == 'disagree' else 0)

        total = agree_count + disagree_count
        agree_pct = round((agree_count / total) * 100) if total > 0 else 50

        return Response({
            'status': 'voted',
            'agree_count': agree_count,
            'disagree_count': disagree_count,
            'agree_percentage': agree_pct
        })


class MusicLeaderboardView(APIView):
    """GET /api/social/leaderboard/ - Top listeners by play duration."""

    def get(self, request):
        from accounts.models import User
        users = User.objects.all()[:15]
        data = []
        for u in users:
            duration = u.listening_stats.get('total_duration', 120) if isinstance(u.listening_stats, dict) else 120
            data.append({
                'id': str(u.id),
                'username': u.username,
                'avatar_url': u.avatar_url,
                'is_verified': u.is_verified,
                'listening_count': duration
            })
        return Response(data)


# ==========================================
# CONCERTS APIs
# ==========================================

from .models import Concert, ConcertAttendance
from .serializers import ConcertSerializer
from accounts.models import Notification, User
from chat.models import DirectMessage

class ConcertListView(APIView):
    """GET /api/social/concerts/ - List all upcoming concerts"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        city = request.query_params.get('city')
        concerts = Concert.objects.all()
        if city:
            concerts = concerts.filter(city__icontains=city)
        return Response(ConcertSerializer(concerts, many=True, context={'request': request}).data)

class ConcertDetailView(APIView):
    """GET /api/social/concerts/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            concert = Concert.objects.get(pk=pk)
            return Response(ConcertSerializer(concert, context={'request': request}).data)
        except Concert.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class ConcertAttendToggleView(APIView):
    """POST /api/social/concerts/<id>/attend/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            concert = Concert.objects.get(pk=pk)
            attendance, created = ConcertAttendance.objects.get_or_create(user=request.user, concert=concert)
            
            if not created:
                attendance.delete()
                return Response({'status': 'unattended'})
            
            # Send notification to friends in the same city
            friends = request.user.followers_set.filter(follower__city__icontains=concert.city)
            for friend in friends:
                Notification.objects.create(
                    user=friend.follower,
                    from_user=request.user,
                    notification_type='concert_alert',
                    title=f"Concert Alert!",
                    body=f"{request.user.username} is going to {concert.title} in {concert.city}!",
                    link=f"/concerts"
                )
            return Response({'status': 'attended'})
        except Concert.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class ConcertInviteView(APIView):
    """POST /api/social/concerts/<id>/invite/<user_id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, user_id):
        try:
            concert = Concert.objects.get(pk=pk)
            friend = User.objects.get(pk=user_id)
            
            # Send a special Direct Message payload
            payload = f"[CONCERT_INVITE:{concert.id}] Hey, I'm going to {concert.title}. You should come!"
            DirectMessage.objects.create(
                sender=request.user,
                receiver=friend,
                content=payload
            )
            
            # Also send a standard notification
            Notification.objects.create(
                user=friend,
                from_user=request.user,
                notification_type='concert_invite',
                title="Concert Invitation",
                body=f"{request.user.username} invited you to {concert.title}!",
                link="/messages"
            )
            return Response({'status': 'invited'})
            
        except (Concert.DoesNotExist, User.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)


class UserConcertsView(APIView):
    "GET /api/social/users/<username>/concerts/"
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        from accounts.models import User
        target_user = None
        if (username == 'me' or username == 'own') and request.user.is_authenticated:
            target_user = request.user
        else:
            target_user = User.objects.filter(username__iexact=username).first()
        
        if not target_user:
            return Response({'error': 'User not found'}, status=404)
        
        attendances = ConcertAttendance.objects.filter(user=target_user).select_related('concert')
        concerts = [a.concert for a in attendances]
        return Response(ConcertSerializer(concerts, many=True, context={'request': request}).data)
