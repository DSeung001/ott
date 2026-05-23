from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.constants import (
    get_auth_code_cache_key,
    get_email_verified_cache_key,
    get_identity_verified_cache_key,
)

User = get_user_model()

NEW_EMAIL = "newuser@example.com"
EXISTING_EMAIL = "existing@example.com"
PASSWORD = "secure-pass-123"


class EmailSignupCheckTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(email=EXISTING_EMAIL, password=PASSWORD)

    def test_missing_email_return_400(self):
        url = reverse("users:email_signup_check")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_available_email_return_avliable(self):
        url = reverse("users:email_signup_check")
        response = self.client.get(url, {"email": NEW_EMAIL})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "AVAILABLE")

    def test_invalid_email_return_exist(self):
        url = reverse("users:email_signup_check")
        response = self.client.get(url, {"email": EXISTING_EMAIL})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "EXIST")


class ExistingUserFlowTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(email=EXISTING_EMAIL, password=PASSWORD)

    def test_exising_email_reports_exist(self):
        url = reverse("users:email_signup_check")
        response = self.client.get(url, {"email": EXISTING_EMAIL})
        self.assertEqual(response.data["status"], "EXIST")


class NewUserSignupTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.signup_payload = {
            "email": NEW_EMAIL,
            "password": PASSWORD,
            "password_confirm": PASSWORD,
        }

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

    def test_new_email_full_signup_flow(self):
        check = self.client.get(
            reverse("users:email_signup_check"), {"email": NEW_EMAIL}
        )
        self.assertEqual(check.data["status"], "AVAILABLE")

        self._run_email_verification(NEW_EMAIL)
        self._run_identity_verification(NEW_EMAIL)

        response = self.client.post(
            reverse("users:signup"), self.signup_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertTrue(User.objects.filter(email=NEW_EMAIL).exists())

    def test_signup_without_verification_returns_400(self):
        response = self.client.post(
            reverse("users:signup"), self.signup_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=NEW_EMAIL).exists())

