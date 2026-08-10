from django.urls import path
from . import views

urlpatterns = [
    path('feed/', views.FeedView.as_view(), name='feed'),
    path('posts/', views.CreatePostView.as_view(), name='create_post'),
    path('posts/<str:post_id>/', views.PostDetailView.as_view(), name='post_detail'),
    path('posts/<str:post_id>/like/', views.LikeToggleView.as_view(), name='like_toggle'),
    path('posts/<str:post_id>/comments/', views.CommentListCreateView.as_view(), name='comments'),
    path('posts/<str:post_id>/repost/', views.RepostToggleView.as_view(), name='repost_toggle'),
    path('posts/<str:post_id>/bookmark/', views.BookmarkToggleView.as_view(), name='bookmark_toggle'),
    path('users/<str:username>/posts/', views.UserPostsView.as_view(), name='user_posts'),
    path('users/<str:username>/reposts/', views.UserRepostsView.as_view(), name='user_reposts'),
    path('listening/', views.LogListeningView.as_view(), name='log_listening'),
    path('listening/feed/', views.ListeningFeedView.as_view(), name='listening_feed'),
    path('leaderboard/', views.MusicLeaderboardView.as_view(), name='music_leaderboard'),
    path('listen-together/', views.ListenTogetherRoomView.as_view(), name='listen_together'),
    path('posts/<str:post_id>/vote/', views.HotTakeVoteView.as_view(), name='hot_take_vote'),
    
    # Concerts
    path('concerts/', views.ConcertListView.as_view(), name='concert_list'),
    path('concerts/<str:pk>/', views.ConcertDetailView.as_view(), name='concert_detail'),
    path('concerts/<str:pk>/attend/', views.ConcertAttendToggleView.as_view(), name='concert_attend_toggle'),
    path('concerts/<str:pk>/invite/<str:user_id>/', views.ConcertInviteView.as_view(), name='concert_invite'),
    path('users/<str:username>/concerts/', views.UserConcertsView.as_view(), name='user_concerts'),
]

