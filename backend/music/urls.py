from django.urls import path
from . import views

urlpatterns = [
    path('artists/', views.ArtistListView.as_view(), name='artist_list'),
    path('artists/<str:artist_id>/', views.ArtistDetailView.as_view(), name='artist_detail'),
    path('tracks/', views.TrackListView.as_view(), name='track_list'),
    path('tracks/<str:track_id>/', views.TrackDetailView.as_view(), name='track_detail'),
    path('tracks/trending/', views.TrendingTracksView.as_view(), name='trending_tracks'),
    path('vinyl-wall/', views.VinylWallView.as_view(), name='vinyl_wall'),
    path('vinyl-wall/<str:username>/', views.VinylWallView.as_view(), name='vinyl_wall_user'),
    path('vinyl-wall/item/<str:item_id>/', views.VinylWallView.as_view(), name='vinyl_wall_delete'),
    path('vinyl-wall/reorder/', views.VinylWallReorderView.as_view(), name='vinyl_wall_reorder'),
    path('search/', views.SearchView.as_view(), name='music_search'),
    path('scrape-info/', views.ScrapeInfoView.as_view(), name='scrape_info'),
]

