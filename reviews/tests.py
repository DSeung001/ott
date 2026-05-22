from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Avg
from django.test import TestCase

from contents.models import Series, Season, Video
from reviews.models import Review
from streams.models import WatchingHistory

User = get_user_model()


class OttFlowTests(TestCase):
    def setUp(self):
        self.viewer = User.objects.create_user(
            email='viewer@example.com',
            password='password',
        )
        self.liker = User.objects.create_user(
            email='liker@example.com',
            password='password',
        )

        self.series = Series.objects.create(name="시리즈")
        self.season = Season.objects.create(
            series=self.series,
            name="시즌",
            synopsis="test",
            start_date=date(2024, 1, 1),
        )
        self.video = Video.objects.create(
            season=self.season,
            name="1화",
            video_url="https://example.com/ep1",
            duration_seconds=1200,
            thumbnail_url="https://example.com/thumb1",
            episode_number=1,
        )

    def test_watch_video_review_and_like(self):
        # 시청 기록
        history, created = WatchingHistory.objects.update_or_create(
            user=self.viewer,
            video=self.video,
            # default가 아닌 값으로 조건 검색
            defaults={
                "watched_seconds": 1200,
                "is_completed": True,
            }
        )
        self.assertTrue(created)
        self.assertEqual(history.watched_seconds, 1200)

        episode_review = Review.objects.create(
            user=self.viewer,
            video=self.video,
            text="재밌음",
            rating=None,
        )
        self.assertIsNone(episode_review.rating)

        season_review = Review.objects.create(
            user=self.viewer,
            season=self.season,
            text="",
            rating=Decimal("4.5")
        )

        season_review.likes.add(self.liker)
        self.assertEqual(season_review.likes.count(), 1)

        series_avg = (
            Review.objects.filter(
                season__series=self.series,
                rating__isnull=False,
            ).aggregate(avg=Avg("rating"))["avg"]
        )
        self.assertEqual(series_avg, Decimal("4.5"))