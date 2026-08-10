from django.urls import path
from . import views

urlpatterns = [
    path('quizzes/featured/', views.FeaturedQuizzesView.as_view(), name='featured_quizzes'),
    path('start/', views.StartQuizView.as_view(), name='start_quiz'),
    path('answer/', views.SubmitAnswerView.as_view(), name='submit_answer'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('badges/<str:username>/', views.UserBadgesView.as_view(), name='user_badges'),
    path('stats/', views.UserTriviaStatsView.as_view(), name='user_stats'),
]
