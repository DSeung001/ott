from rest_framework import authentication, exceptions
from users.auth_tokens import get_user_from_token

class SessionTokenAuthentication(authentication.BaseAuthentication):
    keyword = 'Token'

    # 인증에 필요한 해더 정의
    def authenticate_header(self, request):
        return self.keyword

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).split()
        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None
        # 단어 2개가 아닌 경우
        if len(auth) != 2:
            raise exceptions.AuthenticationFailed('잘못된 토큰 헤더입니다.')
        user = get_user_from_token(auth[1].decode())
        if not user:
            raise exceptions.AuthenticationFailed('유효하지 않은 토큰입니다.')
        if not user.is_active:
            raise exceptions.AuthenticationFailed('비활성 사용자입니다.')
        return (user, auth[1].decode())  # request.auth에 key 저장 가능