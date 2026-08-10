from rest_framework import serializers
from .models import Quiz, TriviaQuestion, TriviaAttempt, Badge, UserBadge, UserTriviaStats
from music.serializers import ArtistMiniSerializer


class QuizSerializer(serializers.ModelSerializer):
    artist = ArtistMiniSerializer(read_only=True)
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'cover_image_url', 'quiz_type', 'artist', 'is_featured', 'questions_count']

    def get_questions_count(self, obj):
        return obj.questions.count()


class TriviaQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriviaQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'difficulty', 'category']


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon_url', 'badge_type']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at']


class UserTriviaStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTriviaStats
        fields = ['total_score', 'total_correct', 'total_attempted', 'current_streak', 'best_streak']
