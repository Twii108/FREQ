from django.contrib import admin
from .models import Quiz, TriviaQuestion, Badge, UserBadge, UserTriviaStats

admin.site.register(Quiz)
admin.site.register(TriviaQuestion)
admin.site.register(Badge)
admin.site.register(UserBadge)
admin.site.register(UserTriviaStats)
