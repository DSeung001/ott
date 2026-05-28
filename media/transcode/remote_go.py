from media.models import TranscodeJob
from media.transcode.base import TranscodeBackend

class RemoteGoBackend(TranscodeBackend):
    def run(self, job: TranscodeJob):
        raise NotImplementedError('Golang 인코딩 서버 연동 전')