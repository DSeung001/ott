from django.conf import settings

from media.constants import LOCAL_FFMPEG, REMOTE_GO
from media.transcode.base import TranscodeBackend
from media.transcode.local_ffmpeg import LocalFFmpegBackend

def get_backend(name:str | None = None) -> TranscodeBackend:
    key = name or settings.TRANSCODE_BACKEND
    if key == LOCAL_FFMPEG:
        return LocalFFmpegBackend()
    if key == REMOTE_GO:
        from media.transcode.remote_go import RemoteGoBackend
        return RemoteGoBackend()
    raise ValueError(f"Unknown backend: {key}")