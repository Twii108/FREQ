from django.db import models


class Quiz(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    cover_image_url = models.URLField(blank=True, default='')
    quiz_type = models.CharField(max_length=50, default='artist')
    artist = models.ForeignKey('music.Artist', on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quizzes'

    def __str__(self):
        return self.title


class TriviaQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    artist = models.ForeignKey('music.Artist', on_delete=models.CASCADE, null=True, blank=True)
    question_text = models.TextField()
    option_a = models.CharField(max_length=300)
    option_b = models.CharField(max_length=300)
    option_c = models.CharField(max_length=300)
    option_d = models.CharField(max_length=300)
    correct_option = models.CharField(max_length=1)
    difficulty = models.CharField(max_length=10, default='medium')
    category = models.CharField(max_length=50, default='general')

    class Meta:
        db_table = 'trivia_questions'


class TriviaAttempt(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='trivia_attempts')
    question = models.ForeignKey(TriviaQuestion, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1)
    is_correct = models.BooleanField()
    time_taken_seconds = models.IntegerField(default=0)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trivia_attempts'


class Badge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    icon_url = models.URLField(blank=True, default='')
    criteria = models.JSONField(default=dict)
    badge_type = models.CharField(max_length=50, default='trivia')

    class Meta:
        db_table = 'badges'

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_badges'
        unique_together = ('user', 'badge')


class UserTriviaStats(models.Model):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='trivia_stats')
    total_score = models.IntegerField(default=0)
    total_correct = models.IntegerField(default=0)
    total_attempted = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)

    class Meta:
        db_table = 'user_trivia_stats'
