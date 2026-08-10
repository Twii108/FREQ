import random
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from music.models import Artist, Track
from accounts.models import Notification
from .models import Quiz, TriviaQuestion, TriviaAttempt, Badge, UserBadge, UserTriviaStats
from .serializers import QuizSerializer, TriviaQuestionSerializer, BadgeSerializer, UserBadgeSerializer, UserTriviaStatsSerializer


def auto_generate_questions(artist):
    """Auto-generate trivia questions from scraped music data."""
    questions = []
    tracks = list(artist.tracks.all())
    all_artists = list(Artist.objects.exclude(id=artist.id).values_list('name', flat=True)[:50])

    for track in tracks[:5]:
        # Q: Who sings this track?
        wrong = random.sample(all_artists, min(3, len(all_artists)))
        options = [artist.name] + wrong[:3]
        random.shuffle(options)
        correct = chr(97 + options.index(artist.name))
        questions.append(TriviaQuestion(
            artist=artist, question_text=f'Who sings "{track.title}"?',
            option_a=options[0], option_b=options[1],
            option_c=options[2] if len(options) > 2 else 'Unknown',
            option_d=options[3] if len(options) > 3 else 'None of these',
            correct_option=correct, category='artist', difficulty='easy',
        ))

        # Q: Which album features this track?
        if track.album_name:
            all_albums = list(Track.objects.exclude(id=track.id).values_list('album_name', flat=True).distinct()[:20])
            wrong_albums = random.sample(all_albums, min(3, len(all_albums)))
            opts = [track.album_name] + wrong_albums[:3]
            random.shuffle(opts)
            correct = chr(97 + opts.index(track.album_name))
            questions.append(TriviaQuestion(
                artist=artist, question_text=f'Which album features the track "{track.title}"?',
                option_a=opts[0], option_b=opts[1],
                option_c=opts[2] if len(opts) > 2 else 'Unknown',
                option_d=opts[3] if len(opts) > 3 else 'None of these',
                correct_option=correct, category='album', difficulty='medium',
            ))

    if artist.genres:
        genre = artist.genres[0] if artist.genres else 'Pop'
        all_genres = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'Electronic', 'Classical', 'Indie', 'Metal']
        wrong_genres = [g for g in all_genres if g.lower() != genre.lower()][:3]
        opts = [genre] + wrong_genres
        random.shuffle(opts)
        correct = chr(97 + opts.index(genre))
        questions.append(TriviaQuestion(
            artist=artist, question_text=f'What is the primary genre of {artist.name}?',
            option_a=opts[0], option_b=opts[1], option_c=opts[2], option_d=opts[3],
            correct_option=correct, category='genre', difficulty='easy',
        ))

    return questions


class FeaturedQuizzesView(APIView):
    """GET /api/trivia/quizzes/featured/"""

    def get(self, request):
        quizzes = Quiz.objects.filter(is_featured=True)[:10]
        return Response(QuizSerializer(quizzes, many=True).data)


class StartQuizView(APIView):
    """POST /api/trivia/start/ - Start quiz for an artist."""

    def post(self, request):
        artist_id = request.data.get('artist_id')
        if artist_id:
            try:
                # Support MongoDB string ID or Spotify/iTunes ID
                if Artist.objects.filter(id=artist_id).exists():
                    artist = Artist.objects.get(id=artist_id)
                elif Artist.objects.filter(spotify_id=artist_id).exists():
                    artist = Artist.objects.get(spotify_id=artist_id)
                else:
                    # Case insensitive name fallback
                    artist = Artist.objects.filter(name__iexact=artist_id).first()
                    if not artist:
                        return Response({'error': 'Artist not found'}, status=status.HTTP_404_NOT_FOUND)
            except Exception:
                artist = Artist.objects.filter(spotify_id=artist_id).first()
                if not artist:
                    return Response({'error': 'Artist not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            artists = Artist.objects.all()
            if not artists.exists():
                return Response({'error': 'No artists in database'}, status=status.HTTP_404_NOT_FOUND)
            artist = random.choice(list(artists[:20]))

        existing = list(TriviaQuestion.objects.filter(artist=artist))
        if len(existing) < 5:
            generated = auto_generate_questions(artist)
            TriviaQuestion.objects.bulk_create(generated)
            existing = list(TriviaQuestion.objects.filter(artist=artist))

        questions = random.sample(existing, min(10, len(existing)))
        return Response({
            'artist': {'id': artist.id, 'name': artist.name, 'image_url': artist.image_url},
            'questions': TriviaQuestionSerializer(questions, many=True).data,
        })


class SubmitAnswerView(APIView):
    """POST /api/trivia/answer/"""

    def post(self, request):
        question_id = request.data.get('question_id')
        answer = request.data.get('answer', '').lower()
        time_taken = request.data.get('time_taken', 0)

        try:
            question = TriviaQuestion.objects.get(id=question_id)
        except TriviaQuestion.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

        is_correct = answer == question.correct_option.lower()
        TriviaAttempt.objects.create(
            user=request.user, question=question,
            selected_option=answer, is_correct=is_correct, time_taken_seconds=time_taken,
        )

        stats, _ = UserTriviaStats.objects.get_or_create(user=request.user)
        stats.total_attempted += 1
        if is_correct:
            stats.total_correct += 1
            stats.total_score += 10
            stats.current_streak += 1
            stats.best_streak = max(stats.best_streak, stats.current_streak)
        else:
            stats.current_streak = 0
        stats.save()

        return Response({
            'is_correct': is_correct,
            'correct_option': question.correct_option,
            'score': stats.total_score,
            'streak': stats.current_streak,
        })


class LeaderboardView(APIView):
    """GET /api/trivia/leaderboard/"""

    def get(self, request):
        leaders = UserTriviaStats.objects.select_related('user').order_by('-total_score')[:20]
        result = []
        for stat in leaders:
            result.append({
                'username': stat.user.username,
                'avatar_url': stat.user.avatar_url,
                'total_score': stat.total_score,
                'total_correct': stat.total_correct,
                'best_streak': stat.best_streak,
            })
        return Response(result)


class UserBadgesView(APIView):
    """GET /api/trivia/badges/<username>/"""

    def get(self, request, username):
        from accounts.models import User
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        badges = UserBadge.objects.filter(user=user).select_related('badge')
        return Response(UserBadgeSerializer(badges, many=True).data)


class UserTriviaStatsView(APIView):
    """GET /api/trivia/stats/"""

    def get(self, request):
        stats, _ = UserTriviaStats.objects.get_or_create(user=request.user)
        return Response(UserTriviaStatsSerializer(stats).data)
