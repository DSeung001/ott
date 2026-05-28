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
        if not video.source:
            raise ValueError('source_file 없음')

        # Q: 이러면 생기는건 프론트에서 접근이 가능한게 아닌 서버 경로에 media인데
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