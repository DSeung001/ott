---
name: CMAF 업로드 파이프라인
overview: Admin 업로드 → TranscodeJob → process_transcode_jobs + ffmpeg → ready 시 API/프론트 재생. 아래 순서대로 파일을 추가·수정하면 됨.
todos:
  - id: step1-models
    content: "Step 1: 현재 models.py 정합 (Series에 genres/tags, Video FK·nullable 정리) + migration"
    status: pending
  - id: step2-settings
    content: "Step 2: config/settings.py + urls.py"
    status: pending
  - id: step3-transcode
    content: "Step 3: media/transcode/* + storage.py + management command"
    status: pending
  - id: step4-admin
    content: "Step 4: media/admin.py"
    status: pending
  - id: step5-api
    content: "Step 5: serializers, views, urls"
    status: pending
  - id: step6-frontend
    content: "Step 6: next.config, media-api, browse/watch pages"
    status: pending
  - id: step7-tests
    content: "Step 7: tests + readme + reviews/tests fixture"
    status: pending
isProject: false
---

# CMAF 업로드 파이프라인 — 코딩 가이드

> **워커 선택**: Golang 인코딩 서버 예정이면 `TranscodeJob` + `get_backend()` 스위치만 유지. Celery/RQ는 넣지 않음.

## 생성·수정 파일 목록

```
media/
  constants.py              # 수정 — ProcessingStatus, TranscodeJobStatus
  models.py                 # 수정 — Video genres/tags M2M, TranscodeJob
  storage.py                # 신규 — 파일 삭제 유틸
  admin.py                  # 수정
  serializers.py            # 신규
  views.py                  # 수정
  urls.py                   # 신규
  signals.py                # 신규 (선택, admin에서 직접 해도 됨)
  transcode/
    __init__.py
    base.py
    registry.py
    paths.py
    local_ffmpeg.py
    remote_go.py            # 스텁만
  management/commands/
    process_transcode_jobs.py
  migrations/0002_....py    # makemigrations
config/
  settings.py               # 수정
  urls.py                   # 수정
frontend/
  next.config.ts            # 수정
  lib/media-api.ts          # 신규
  components/watch/VideoPlayer.tsx  # 신규
  app/browse/page.tsx       # 신규
  app/watch/[id]/page.tsx   # 신규
  app/page.tsx              # 수정
reviews/tests.py            # fixture에 processing_status 추가
readme.md                   # 워커 실행 안내
```

---

## Step 1 — `media/constants.py` + `media/models.py`

현재 코드 기준으로 **모델·상수만** 맞춘다. (transcode/admin/API는 Step 2 이후 — import 시 `ProcessingStatus` / `manifest_url` 사용)

### 반영할 현재 구조 ( [`media/models.py`](media/models.py) 기준 )


| 구분 | 내용 |
|------|------|
| `Genre` / `Tag` | 마스터 테이블 (변경 없음) |
| `Series` | **`genres` + `tags` M2M** (`related_name="series"`) — 태그·장르는 **시리즈 단위** |
| `Video` | 업로드·트랜스코드 필드만. **genres/tags M2M 없음** |
| `TranscodeJob` | `Video` 1:N |
| `Season` | 사용하지 않음 |

Step 1에서 **추가로 손볼 것** (현재 파일과의 차이):

- `Video.series` FK 추가 (`Series` 소속 영상)
- `thumbnail_url`, `duration_seconds` → pending 허용 (`blank=True, null=True`)
- `TranscodeJob.external_jbo_id` → `external_job_id` 오타 수정
- 0001 잔존 `video_url` / `Season` 테이블은 마이그레이션으로 정리

- `TextChoices`는 [`media/constants.py`](media/constants.py)에만 둔다 (이미 `ProcessingStatus`, `TranscodeJobStatus` 있음).
- 재생 URL은 **`manifest_url`** (ffmpeg 완료 시 설정).

---

### `media/constants.py` (현재 그대로 유지)

```python
from django.db import models

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
```

---

### `media/models.py` (목표 — 현재 파일 + `Video.series` + nullable)

```python
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
    genres = models.ManyToManyField(Genre, related_name="series", blank=True)
    tags = models.ManyToManyField(Tag, related_name="series", blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


def video_source_upload_to(instance, filename):
    return f"videos/source/{instance.pk or 'tmp'}/{filename}"


class Video(models.Model):
    series = models.ForeignKey(
        Series,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    name = models.CharField(max_length=255)

    source_file = models.FileField(
        upload_to=video_source_upload_to,
        null=True,
        blank=True,
    )
    processing_status = models.CharField(
        max_length=32,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    storage_prefix = models.CharField(max_length=512, blank=True, null=True)
    processing_error = models.CharField(max_length=512, blank=True, null=True)
    manifest_url = models.URLField(max_length=512, blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"[{self.name}] process: ({self.processing_status})"


class TranscodeJob(models.Model):
    video = models.ForeignKey(
        Video,
        related_name="transcode_jobs",
        on_delete=models.CASCADE,
    )
    status = models.CharField(
        max_length=20,
        choices=TranscodeJobStatus.choices,
        default=TranscodeJobStatus.PENDING,
    )
    backend = models.CharField(max_length=32, default="local_ffmpeg")
    external_job_id = models.CharField(max_length=128, blank=True, null=True)
    attempt_count = models.PositiveIntegerField(default=0)
    error_log = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
```

**계층**

```text
Series
  ├── genres (M2M)
  ├── tags   (M2M)   ← 태그·장르는 여기만
  └── Video (FK series)
        └── TranscodeJob
```

**Video에서 태그/장르 읽기 (API·프론트)**

```python
video = Video.objects.select_related("series").prefetch_related(
    "series__genres", "series__tags"
).get(pk=video_id)
tags = video.series.tags.all()
genres = video.series.genres.all()
```

**0001_initial과의 차이**

| 0001 | 현재 계획 |
|------|-----------|
| `Season.genres` / `Season.tags` | → **`Series.genres` / `Series.tags`** |
| `Video` → `Season` FK | → **`Video` → `Series` FK** (`Season` 제거) |
| `Video`에 M2M 없음 | 동일 (영상 단위 태그 없음) |

Admin (Step 4): `SeriesAdmin`에 `filter_horizontal = ("genres", "tags")`, `VideoAdmin`에는 M2M 필드 없음.

---

### 마이그레이션

```bash
python manage.py makemigrations media
python manage.py migrate
```

생성되는 중간 테이블 예: `media_series_genres`, `media_series_tags` (Video M2M 테이블은 **없음**).

- `Video`에 `series_id` NOT NULL로 갈 경우: 기존 row에 default `Series` 1개 만들고 FK 채우는 data migration.
- 0001 `Season` / `video_url` 컬럼: `RemoveField` 또는 미사용 테이블 drop 마이그레이션.

### Step 2+ 연동 시 import (참고만)

```python
from media.constants import ProcessingStatus, TranscodeJobStatus

video.manifest_url = public_url(rel_manifest)
video.processing_status = ProcessingStatus.READY
# 태그 노출: video.series.tags.all()
```

---

## Step 2 — settings / urls

### `[config/settings.py](config/settings.py)` 맨 아래 추가

```python
MEDIA_ROOT = BASE_DIR / 'media_files'
MEDIA_URL = '/media/'

# API 응답·DB에 넣을 manifest 절대 URL (dev)
PUBLIC_MEDIA_BASE_URL = 'http://localhost:8000'

TRANSCODE_BACKEND = 'local_ffmpeg'  # 나중: 'remote_go'

# 대용량 업로드 (바이트, 필요 시 조정)
DATA_UPLOAD_MAX_MEMORY_SIZE = 524288000   # 500MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 524288000
```

### `[config/urls.py](config/urls.py)`

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('media.urls')),  # 추가
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## Step 3 — transcode 패키지

### `media/transcode/paths.py`

```python
from django.conf import settings

def hls_prefix(video_id: int) -> str:
    return f'videos/hls/{video_id}/'

def hls_dir(video_id: int):
    return settings.MEDIA_ROOT / hls_prefix(video_id).rstrip('/')

def public_url(relative_path: str) -> str:
    base = settings.PUBLIC_MEDIA_BASE_URL.rstrip('/')
    rel = relative_path.lstrip('/')
    return f'{base}/{rel}'
```

### `media/transcode/base.py`

```python
from abc import ABC, abstractmethod
from media.models import TranscodeJob

class TranscodeBackend(ABC):
    @abstractmethod
    def run(self, job: TranscodeJob) -> None:
        """성공 시 job/video 상태 갱신, 실패 시 예외 또는 error_log 기록."""
        ...
```

### `media/transcode/registry.py`

```python
from django.conf import settings
from media.transcode.base import TranscodeBackend
from media.transcode.local_ffmpeg import LocalFFmpegBackend

def get_backend(name: str | None = None) -> TranscodeBackend:
    key = name or settings.TRANSCODE_BACKEND
    if key == 'local_ffmpeg':
        return LocalFFmpegBackend()
    if key == 'remote_go':
        from media.transcode.remote_go import RemoteGoBackend
        return RemoteGoBackend()
    raise ValueError(f'Unknown backend: {key}')
```

### `media/transcode/local_ffmpeg.py` (핵심)

```python
import json
import subprocess
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from media.models import TranscodeJob, TranscodeJobStatus, Video, VideoProcessingStatus
from media.transcode.base import TranscodeBackend
from media.transcode.paths import hls_dir, hls_prefix, public_url


class LocalFFmpegBackend(TranscodeBackend):
    def run(self, job: TranscodeJob) -> None:
        video = job.video
        if not video.source_file:
            raise ValueError('source_file 없음')

        out_dir = hls_dir(video.id)
        out_dir.mkdir(parents=True, exist_ok=True)

        manifest_name = 'master.m3u8'
        manifest_path = out_dir / manifest_name

        # HLS fMP4 (CMAF)
        subprocess.run(
            [
                'ffmpeg', '-y',
                '-i', video.source_file.path,
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
                '-c:a', 'aac', '-b:a', '128k',
                '-hls_segment_type', 'fmp4',
                '-hls_playlist_type', 'vod',
                '-hls_time', '4',
                '-hls_fmp4_init_filename', 'init.mp4',
                '-hls_segment_filename', 'seg_%03d.m4s',
                str(manifest_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        # duration
        probe = subprocess.run(
            [
                'ffprobe', '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'json',
                video.source_file.path,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        duration = int(float(json.loads(probe.stdout)['format']['duration']))

        # thumbnail
        thumb_name = 'thumb.jpg'
        thumb_path = out_dir / thumb_name
        subprocess.run(
            [
                'ffmpeg', '-y', '-ss', '00:00:03',
                '-i', video.source_file.path,
                '-vframes', '1',
                str(thumb_path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        prefix = hls_prefix(video.id)
        rel_manifest = f'{prefix}{manifest_name}'
        rel_thumb = f'{prefix}{thumb_name}'

        with transaction.atomic():
            video.storage_prefix = prefix
            video.duration_seconds = duration
            video.video_url = public_url(rel_manifest)
            video.thumbnail_url = public_url(rel_thumb)
            video.processing_status = VideoProcessingStatus.READY
            video.processing_error = ''
            video.save(update_fields=[
                'storage_prefix', 'duration_seconds', 'video_url',
                'thumbnail_url', 'processing_status', 'processing_error',
            ])

            job.status = TranscodeJobStatus.SUCCEEDED
            job.finished_at = timezone.now()
            job.save(update_fields=['status', 'finished_at'])
```

실패 처리는 command 쪽에서 `except` → `job.status=FAILED`, `video.processing_status=FAILED`, `processing_error=str(e)`.

### `media/transcode/remote_go.py` (스텁)

```python
from media.models import TranscodeJob
from media.transcode.base import TranscodeBackend

class RemoteGoBackend(TranscodeBackend):
    def run(self, job: TranscodeJob) -> None:
        raise NotImplementedError('Golang 인코딩 서버 연동 전')
```

### `media/storage.py`

```python
import shutil
from pathlib import Path

from django.conf import settings

from media.transcode.paths import hls_dir

def delete_video_files(video) -> None:
    if video.source_file:
        video.source_file.delete(save=False)
    if video.id:
        path = hls_dir(video.id)
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
```

### `media/management/commands/process_transcode_jobs.py`

```python
import time

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from media.models import TranscodeJob, TranscodeJobStatus, Video, VideoProcessingStatus
from media.transcode.registry import get_backend


class Command(BaseCommand):
    help = 'pending TranscodeJob 처리 (ffmpeg)'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true')
        parser.add_argument('--sleep', type=int, default=5)

    def handle(self, *args, **options):
        while True:
            processed = self._process_one()
            if options['once']:
                break
            if not processed:
                time.sleep(options['sleep'])

    def _process_one(self) -> bool:
        with transaction.atomic():
            job = (
                TranscodeJob.objects
                .select_for_update(skip_locked=True)
                .filter(status=TranscodeJobStatus.PENDING)
                .order_by('created_at')
                .first()
            )
            if not job:
                return False

            job.status = TranscodeJobStatus.PROCESSING
            job.started_at = timezone.now()
            job.attempt_count += 1
            job.save(update_fields=['status', 'started_at', 'attempt_count'])

            video = job.video
            video.processing_status = VideoProcessingStatus.PROCESSING
            video.save(update_fields=['processing_status'])

        try:
            get_backend(job.backend).run(job)
        except Exception as exc:
            self._mark_failed(job, str(exc))
        return True

    def _mark_failed(self, job, message: str):
        job.status = TranscodeJobStatus.FAILED
        job.error_log = message
        job.finished_at = timezone.now()
        job.save(update_fields=['status', 'error_log', 'finished_at'])

        video = job.video
        video.processing_status = VideoProcessingStatus.FAILED
        video.processing_error = message[:2000]
        video.save(update_fields=['processing_status', 'processing_error'])
```

**로컬 실행 (터미널 2개)**

```bash
# 터미널 1
python manage.py runserver

# 터미널 2
python manage.py process_transcode_jobs
```

---

## Step 4 — `media/admin.py`

```python
from django.contrib import admin, messages
from django.utils import timezone

from media.models import (
    Genre, Season, Series, Tag, TranscodeJob, TranscodeJobStatus,
    Video, VideoProcessingStatus,
)
from media.storage import delete_video_files
from media.transcode.paths import hls_dir


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'season', 'episode_number', 'processing_status')
    readonly_fields = (
        'processing_status', 'storage_prefix', 'processing_error',
        'video_url', 'thumbnail_url', 'duration_seconds',
    )
    fields = (
        'season', 'name', 'episode_number', 'source_file',
        'processing_status', 'processing_error',
        'video_url', 'thumbnail_url', 'duration_seconds', 'storage_prefix',
    )
    actions = ['retry_transcode']

    def save_model(self, request, obj, form, change):
        source_changed = 'source_file' in form.changed_data and obj.source_file
        super().save_model(request, obj, form, change)

        if source_changed:
            # 재업로드: 기존 HLS 삭제
            if obj.id and hls_dir(obj.id).exists():
                import shutil
                shutil.rmtree(hls_dir(obj.id), ignore_errors=True)

            obj.processing_status = VideoProcessingStatus.PENDING
            obj.processing_error = ''
            obj.video_url = ''
            obj.thumbnail_url = ''
            obj.duration_seconds = None
            obj.save(update_fields=[
                'processing_status', 'processing_error',
                'video_url', 'thumbnail_url', 'duration_seconds',
            ])

            TranscodeJob.objects.create(
                video=obj,
                status=TranscodeJobStatus.PENDING,
                backend='local_ffmpeg',
            )
            self.message_user(request, '트랜스코드 Job이 생성되었습니다. 워커를 실행하세요.')

    def delete_model(self, request, obj):
        delete_video_files(obj)
        super().delete_model(request, obj)

    def delete_queryset(self, request, queryset):
        for obj in queryset:
            delete_video_files(obj)
        super().delete_queryset(request, queryset)

    @admin.action(description='다시 트랜스코드')
    def retry_transcode(self, request, queryset):
        for video in queryset:
            if not video.source_file:
                continue
            TranscodeJob.objects.create(video=video, status=TranscodeJobStatus.PENDING)
            video.processing_status = VideoProcessingStatus.PENDING
            video.save(update_fields=['processing_status'])


admin.site.register(Series)
admin.site.register(Season)
admin.site.register(Genre)
admin.site.register(Tag)
```

Admin에서 `Season` → `Video` 추가 → mp4 `source_file` 업로드 → 저장 → 워커 돌리기.

---

## Step 5 — API

### `media/serializers.py`

```python
from rest_framework import serializers
from media.models import Season, Video, VideoProcessingStatus

class SeasonListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ('id', 'name', 'synopsis', 'start_date')

class VideoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ('id', 'name', 'episode_number', 'thumbnail_url', 'duration_seconds')

class VideoPlaybackSerializer(serializers.ModelSerializer):
    manifest_url = serializers.CharField(source='video_url')

    class Meta:
        model = Video
        fields = ('id', 'name', 'episode_number', 'manifest_url', 'thumbnail_url', 'duration_seconds')
```

### `media/views.py`

```python
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from media.models import Season, Video, VideoProcessingStatus
from media.serializers import SeasonListSerializer, VideoListSerializer, VideoPlaybackSerializer


class SeasonListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Season.objects.all().order_by('-start_date')
        return Response(SeasonListSerializer(qs, many=True).data)


class SeasonVideoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, season_id):
        qs = Video.objects.filter(
            season_id=season_id,
            processing_status=VideoProcessingStatus.READY,
        ).order_by('episode_number')
        return Response(VideoListSerializer(qs, many=True).data)


class VideoPlaybackView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        video = get_object_or_404(
            Video,
            pk=video_id,
            processing_status=VideoProcessingStatus.READY,
        )
        return Response(VideoPlaybackSerializer(video).data)
```

### `media/urls.py`

```python
from django.urls import path
from media import views

app_name = 'media'

urlpatterns = [
    path('v1/media/seasons/', views.SeasonListView.as_view(), name='season_list'),
    path('v1/media/seasons/<int:season_id>/videos/', views.SeasonVideoListView.as_view(), name='season_videos'),
    path('v1/media/videos/<int:video_id>/', views.VideoPlaybackView.as_view(), name='video_playback'),
]
```

`config/urls.py`에 `path('api/', include('media.urls'))` 이미 추가됨.

---

## Step 6 — 프론트

### `frontend/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: "http://localhost:8000/media/:path*",
      },
    ];
  },
};

export default nextConfig;
```

### `frontend/lib/media-api.ts`

```typescript
import { authFetch } from "./api";

export type SeasonSummary = {
  id: number;
  name: string;
  synopsis: string;
  start_date: string;
};

export type VideoSummary = {
  id: number;
  name: string;
  episode_number: number;
  thumbnail_url: string;
  duration_seconds: number;
};

export type VideoPlayback = {
  id: number;
  name: string;
  episode_number: number;
  manifest_url: string;
  thumbnail_url: string;
  duration_seconds: number;
};

export function getSeasons() {
  return authFetch<SeasonSummary[]>("/api/v1/media/seasons/");
}

export function getSeasonVideos(seasonId: number) {
  return authFetch<VideoSummary[]>(`/api/v1/media/seasons/${seasonId}/videos/`);
}

export function getVideoPlayback(videoId: number) {
  return authFetch<VideoPlayback>(`/api/v1/media/videos/${videoId}/`);
}
```

**manifest URL을 프론트 same-origin으로 쓰려면** 백엔드 `public_url` 대신 DB에 **상대 경로**만 저장하는 방법:

```python
# local_ffmpeg.py 성공 시
video.video_url = f'/{settings.MEDIA_URL.strip("/")}/{rel_manifest}'  # 예: /media/videos/hls/3/master.m3u8
```

그러면 `VideoPlayer`에서 `manifest_url` 그대로 fetch (rewrite 적용).

### `frontend/components/watch/VideoPlayer.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

type Props = { src: string };

export function VideoPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src;
      return;
    }

    if (!Hls.isSupported()) return;

    const hls = new Hls();
    hls.loadSource(src);
    hls.attachMedia(el);
    return () => hls.destroy();
  }, [src]);

  return (
    <video ref={videoRef} controls className="w-full max-w-3xl rounded-lg bg-black" />
  );
}
```

```bash
cd frontend && npm install hls.js
```

### `frontend/app/browse/page.tsx` (요지)

- `useEffect` → `getSeasons()` → 첫 시즌 or 선택 시즌 → `getSeasonVideos(seasonId)`
- 카드 클릭 → `/watch/{id}`

### `frontend/app/watch/[id]/page.tsx` (요지)

- `getVideoPlayback(id)` → `VideoPlayer src={playback.manifest_url}`

### `frontend/app/page.tsx`

- "시청 홈 준비 중" → `<Link href="/browse">보러 가기</Link>`

---

## Step 7 — 테스트 수정

### `[reviews/tests.py](reviews/tests.py)`

```python
self.video = Video.objects.create(
  ...
  processing_status='ready',  # VideoProcessingStatus.READY
  video_url="https://example.com/ep1",
  ...
)
```

### `media/tests/test_transcode.py` (요지)

```python
from unittest.mock import patch

@patch('media.transcode.local_ffmpeg.subprocess.run')
def test_job_success(mock_run):
    ...
```

---

## 동작 확인 체크리스트

1. `ffmpeg -version` / `ffprobe -version` OK
2. Admin: Series/Season 생성 → Video + mp4 업로드
3. `python manage.py process_transcode_jobs --once` → `media_files/videos/hls/{id}/master.m3u8` 생성
4. DB: `processing_status=ready`, `video_url` 채워짐
5. 로그인 후 `GET /api/v1/media/seasons/1/videos/` 에 영상 노출
6. `/browse` → `/watch/1` 재생

---

## Golang 전환 시 바꿀 코드만 (나중)


| 파일                           | 변경                                                                   |
| ---------------------------- | -------------------------------------------------------------------- |
| `settings.py`                | `TRANSCODE_BACKEND='remote_go'`, `ENCODING_SERVER_URL`               |
| `remote_go.py`               | `requests.post(f'{URL}/v1/jobs', json={...})` + `external_job_id` 저장 |
| 신규 `media/views_callback.py` | `POST /api/v1/internal/transcode/callback/` → Video ready            |
| `process_transcode_jobs.py`  | remote는 submit만, poll은 별도 command 가능                                 |


출력 경로 규칙 `videos/hls/{id}/master.m3u8` 은 **Go 서버도 동일하게** 맞추면 프론트 수정 없음.

---

## 주의 (코딩 시 자주 막히는 것)

- Admin 저장만 하고 **워커 안 돌리면** 영원히 `pending`
- `source_file` 없이 Video만 만들면 Job 생성 안 함 (의도)
- `video_source_upload_to`에서 `pk` 없을 때: **첫 save 후 pk 생기면** 파일 경로가 어긋날 수 있음 → Admin `save_model`에서 2단계 save 하거나 `upload_to`를 `videos/source/%Y/%m/{filename}` 로 단순화
- 대용량: `runserver` 타임아웃과 무관하게 워커에서만 ffmpeg 실행

