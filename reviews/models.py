from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q, CheckConstraint


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')

    # 시리즈에는 댓글 내용 없이 평점만 매길 수 있음
    text = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    season = models.ForeignKey('contents.Season', on_delete=models.CASCADE, null=True, blank=True,
                               related_name='season_reviews')
    video = models.ForeignKey('contents.Video', on_delete=models.CASCADE, null=True, blank=True,
                              related_name='video_reviews')

    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_spoiler = models.BooleanField(default=False)

    # annotate로 카운트 처리, 좋아요 수가 10만, 100만을 넘어 가지 않음
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='likes', blank=True)

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        null=True,  # 답글과 각 비디오에 대한 댓글은 평점없음
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.0')),
            MaxValueValidator(Decimal('5.0'))
        ]
    )

    class Meta:
        constraints = [
            CheckConstraint(
                condition=(
                        Q(season__isnull=False, video__isnull=True) |
                        Q(season__isnull=True, video__isnull=False)
                ),
                name='review_must_have_target',
            ),
            CheckConstraint(
                # 점수가 있는건 시리즈만 됨
                condition=(
                    Q(rating__isnull=True) |
                    Q(
                        season__isnull=False,
                        video__isnull=True,
                        parent__isnull=True,
                    )
                ),
                name='rating_only_on_season_review',
            )
        ]

    def __str__(self):
        # 파이썬은 "" 도 False 취급
        preview = (self.text or "")[:20]
        return f"{self.user}의 리뷰: {preview or '(내용 없음)'}"
