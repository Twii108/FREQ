from django.urls import path
from . import views

urlpatterns = [
    path('for-you/', views.ForYouView.as_view(), name='for_you'),
    path('similar/<int:track_id>/', views.SimilarTracksView.as_view(), name='similar_tracks'),
    path('taste-match/<int:user_id>/', views.TasteMatchView.as_view(), name='taste_match'),
    path('prompt-match/', views.PromptMatchView.as_view(), name='prompt_match'),
    path('persona/', views.UserPersonaView.as_view(), name='my_persona'),
    path('persona/<str:username>/', views.UserPersonaView.as_view(), name='user_persona'),
]


