from abc import ABC, abstractmethod
from media.models import TranscodeJob


class TranscodeBackend(ABC):
    @abstractmethod
    def run(self, job: TranscodeJob):
        """성공 시 Job/Video 상태 갱신, 실패 시 기록"""