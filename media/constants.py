from django.db import models

LOCAL_FFMPEG = 'local_ffmpeg'
REMOTE_GO = 'remote_go'

class ProcessingStatus(models.TextChoices):
    PENDING = "pending", "대기"
    PROCESSING = "processing", "처리 중"
    READY = "ready", "준비 완료"
    FAILED = "failed", "실패"

class TranscodeJobStatus(models.TextChoices):
    PENDING = "pending", "대기"
    PROCESSING = "processing", "처리 중"
    SUCCEEDED = "succeeded", "성공"
    FAILED = "failed", "실패"