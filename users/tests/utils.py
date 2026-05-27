import re

from django.core.cache import cache
from django.urls import reverse

from rest_framework.test import APITestCase


from users.constants import (
    get_auth_code_cache_key,
    get_email_verified_cache_key,
)

NEW_EMAIL = "newuser@example.com"
EXISTING_EMAIL = "existing@example.com"
PASSWORD = "secure-pass-123"
TOKEN_PATTERN = re.compile(r"^[a-f0-9]{40}$")

class SignupFlowMixin(APITestCase):
    def _run_email_verification(self, email):
        send_url = reverse("users:email_verification_reqeust")
        self.client.post(send_url, {"email": email}, format="json")
        code = cache.get(get_auth_code_cache_key(email))
        self.assertIsNotNone(code)
        confirm_url = reverse("users:email_verification_confirm")
        self.client.post(
            confirm_url,
            {"email": email, "code": code}, format="json"
        )
        self.assertTrue(cache.get(get_email_verified_cache_key(email)))

    def _run_identity_verification(self, email):
        url = reverse("users:identity_verify_mock")
        self.client.post(url, data={"email": email}, format="json")

    def _signup(self, email=NEW_EMAIL, password=PASSWORD):
        self._run_email_verification(email)
        self._run_identity_verification(email)
        return self.client.post(
            reverse("users:signup"),
            {"email": email, "password": password, "password_confirm": password},
            format="json"
        )

    def signup_and_auth(self, email=NEW_EMAIL, password=PASSWORD)->str:
        self._run_email_verification(email)
        self._run_identity_verification(email)

        resp = self.client.post(
            reverse("users:signup"),
            {"email": email, "password": password, "password_confirm": password},
            format="json"
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        token = resp.data["token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        return token