from config import settings


def hls_prefix(video_id: int) -> str:
    return f'videos/hls/{video_id}/'

def hls_dir(vidoe_id: int) -> str:
    # rstrip: 오른쪽 끝 / 제거
    return settings.MEDIA_ROOT / hls_prefix(vidoe_id).rstrip('/')

def public_url(relative_path: str) -> str:
    base = settings.PUBLIC_MEDIA_BASE_URL.rstrip('/')
    rel = relative_path.rstrip('/')
    return f'{base}/{rel}'