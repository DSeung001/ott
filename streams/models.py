from django.conf import settings
from django.db import models

from contents.models import Video


class WatchingHistory(models.Model):
    """시청 기록"""
    # settings.AUTH_USER_MODEL로 문자열 사용해서 임포트 순환 예방
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="watching_histories")
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="watching_history")

    is_completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "video")
