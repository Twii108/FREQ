from django.urls import path
from . import views

urlpatterns = [
    # General feed
    path('feed/', views.FeedView.as_view(), name='feed'),

    # Posts
    path('posts/', views.PostListView.as_view(), name='post_list'),
    path('posts/<str:pk>/', views.PostDetailView.as_view(), name='post_detail'),
    path('posts/<str:pk>/like/', views.LikePostView.as_view(), name='like_post'),
    path('posts/<str:pk>/comment/', views.CommentPostView.as_view(), name='comment_post'),
    path('posts/<str:pk>/repost/', views.RepostView.as_view(), name='repost'),
    path('posts/<str:pk>/bookmark/', views.BookmarkView.as_view(), name='bookmark'),

    # Listen Together
    path('listen-together/', views.ListenTogetherView.as_view(), name='listen_together'),
    
    # Private Rooms
    path('rooms/', views.PrivateRoomListView.as_view(), name='private_rooms'),
    path('rooms/create/', views.CreatePrivateRoomView.as_view(), name='create_room'),
    path('rooms/<str:room_id>/', views.PrivateRoomDetailView.as_view(), name='room_detail'),
    path('rooms/<str:room_id>/join/', views.JoinPrivateRoomView.as_view(), name='join_room'),
    path('rooms/<str:room_id>/request/', views.RequestTrackView.as_view(), name='request_track'),
    path('rooms/<str:room_id>/approve/<int:request_id>/', views.ApproveTrackView.as_view(), name='approve_track'),

    # Concerts
    path('concerts/', views.ConcertListView.as_view(), name='concert_list'),
    path('concerts/<str:pk>/', views.ConcertDetailView.as_view(), name='concert_detail'),
    path('concerts/<str:pk>/attend/', views.ConcertAttendToggleView.as_view(), name='concert_attend_toggle'),
    path('concerts/<str:pk>/invite/<str:user_id>/', views.ConcertInviteView.as_view(), name='concert_invite'),
    path('users/<str:username>/concerts/', views.UserConcertsView.as_view(), name='user_concerts'),
]
