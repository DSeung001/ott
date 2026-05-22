from django.db import models

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

class Video(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='videos')

    title = models.CharField(max_length=255)
    video_url = models.URLField()
    duration = models.PositiveIntegerField() # 초 단위
    thumbnail_url = models.URLField()
    episode_number = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ("season", "episode_number")
