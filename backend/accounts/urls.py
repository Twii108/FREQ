from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/delete/', views.DeleteAccountView.as_view(), name='delete_account'),
    path('profile/<str:username>/', views.PublicProfileView.as_view(), name='public_profile'),
    path('profile/<str:username>/followers/', views.UserFollowersView.as_view(), name='user_followers'),
    path('profile/<str:username>/following/', views.UserFollowingView.as_view(), name='user_following'),
    path('follow/<str:user_id>/', views.FollowToggleView.as_view(), name='follow_toggle'),
    path('block/<str:user_id>/', views.BlockToggleView.as_view(), name='block_toggle'),
    path('blocked-users/', views.BlockedUsersListView.as_view(), name='blocked_users_list'),
    path('search/', views.UserSearchView.as_view(), name='user_search'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/read-all/', views.MarkAllNotificationsReadView.as_view(), name='mark_all_read'),
    path('notifications/<str:notification_id>/read/', views.MarkNotificationReadView.as_view(), name='mark_read'),
    path('notifications/unread-count/', views.UnreadCountView.as_view(), name='unread_count'),
    path('discover/', views.DiscoverUsersView.as_view(), name='discover_users'),
    path('favorite-artists/', views.FavoriteArtistView.as_view(), name='favorite_artists'),
    path('boost/', views.BoostProfileView.as_view(), name='boost_profile'),
]
