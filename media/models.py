from django.db import models

from media.constants import ProcessingStatus, TranscodeJobStatus


class Genre(models.Model):
    name = models.CharField(max_length=63, unique=True)
    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=63, unique=True)
    def __str__(self):
        return self.name

class Series(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.name

class Season(models.Model):
    series = models.ForeignKey(Series, on_delete=models.SET_NULL, null=True, blank=True, related_name='seasons')
    name = models.CharField(max_length=255)
    synopsis = models.TextField()

    # 방영 및 개봉 정보
    FORMAT_CHOICES = [
        ('1_COUR', '1쿨 (약 3개월/12화)'),
        ('2_COUR', '연속 2쿨 (약 6개월/24화)'),
        ('LONG', '장기 방영작 (원피스 등)'),
        ('MOVIE', '영화/극장판'),  # 영화 포맷 추가
    ]
    format_type = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='1_COUR')
    start_date = models.DateField(help_text="방영/개봉 시작일")
    end_date = models.DateField(null=True, blank=True, help_text="종료일 (미정이면 비워둠)")

    # 피벗 테이블 생성, 역참조 이름 seasons
    genres = models.ManyToManyField(Genre, related_name='seasons')
    tags = models.ManyToManyField(Tag, related_name='seasons')

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['series', 'name'], name='unique_season_per_series')
        ]

def video_source_upload_to(instance, filename):
    return f'videos/source/{instance.pk or "tmp"}/{filename}'

class Video(models.Model):
    name = models.CharField(max_length=255)

    source_file = models.FileField(upload_to=video_source_upload_to, null=True, blank=True)
    processing_status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING
    )
    storage_prefix = models.CharField(
        max_length=512,
        blank=True,
        null=True,
    )
    processing_error = models.CharField(
        max_length=512,
        blank=True,
        null=True,
    )
    manifest_url = models.URLField(
        max_length=512,
        blank=True,
        null=True,
    )
    thumbnail_url = models.URLField()
    duration_seconds = models.PositiveIntegerField()  # 초 단위

    def __str__(self):
        return f"[{self.name}] process: ({self.processing_status})"

class TranscodeJob(models.Model):
    video = models.ForeignKey(Video, related_name="transcode_jobs", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=TranscodeJobStatus.choices,
        default=TranscodeJobStatus.PENDING,
    )
    backend = models.CharField(max_length=32, default="local_ffmpeg")
    external_jbo_id = models.CharField(
        max_length=128,
        blank=True,
        null=True,
    )
    attempt_count = models.PositiveIntegerField(default=0) # 재시도
    error_log = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]


