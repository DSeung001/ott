from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import AuthToken
from datetime import timedelta
from django.utils import timezone
from users.constants import (
    DEFAULT_AVATAR_FILE, get_email_verified_cache_key,
)
from users.tests.utils import SignupFlowMixin, EXISTING_EMAIL, PASSWORD, NEW_EMAIL, TOKEN_PATTERN

User = get_user_model()

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


class NewUserSignupTests(SignupFlowMixin):
    def setUp(self):
        cache.clear()
        self.signup_payload = {
            "email": NEW_EMAIL,
            "password": PASSWORD,
            "password_confirm": PASSWORD,
        }

    def test_new_email_full_signup_flow(self):
        check = self.client.get(
            reverse("users:email_signup_check"), {"email": NEW_EMAIL}
        )
        self.assertEqual(check.data["status"], "AVAILABLE")

        response = self._signup()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertRegex(response.data["token"], TOKEN_PATTERN)
        self.assertEqual(response.data["user"]["email"], NEW_EMAIL)
        self.assertTrue(User.objects.filter(email=NEW_EMAIL).exists())

        user = User.objects.get(email=NEW_EMAIL)
        self.assertTrue(
            AuthToken.objects.filter(user=user, key=response.data["token"]).exists()
        )

    def test_signup_without_verification_returns_400(self):
        response = self.client.post(
            reverse("users:signup"), self.signup_payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=NEW_EMAIL).exists())

    def test_signup_token_works_on_profile(self):
        response = self._signup(NEW_EMAIL)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        profile_response = self.client.post(
            reverse("users:profiles"),
            {"nickname": "테스트", "avatar_file": DEFAULT_AVATAR_FILE, "is_adult_mode":True},
            format="json",
        )
        self.assertEqual(profile_response.status_code, status.HTTP_201_CREATED, profile_response.data)
        self.assertEqual(profile_response.data["profile"]["nickname"], "테스트")


class LoginTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(email=EXISTING_EMAIL, password=PASSWORD)

    def test_login_returns_token(self):
        response = self.client.post(
            reverse("users:login"),
            {"email": EXISTING_EMAIL, "password": PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertRegex(response.data["token"], TOKEN_PATTERN)
        self.assertEqual(response.data["user"]["email"], EXISTING_EMAIL)

    def test_login_wrong_password(self):
        response = self.client.post(
            reverse("users:login"),
            {"email": EXISTING_EMAIL, "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SignupTests(SignupFlowMixin):
    def setUp(self):
        cache.clear()

    def test_login_after_signup(self):
        self._signup()
        login_resp = self.client.post(
            reverse("users:login"),
            {"email": NEW_EMAIL, "password": PASSWORD},
            format="json",
        )
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)
        self.assertRegex(login_resp.data["token"], TOKEN_PATTERN)


class LogoutTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(email=EXISTING_EMAIL, password=PASSWORD)

    def _login(self):
        return self.client.post(
            reverse("users:login"),
            {"email": EXISTING_EMAIL, "password": PASSWORD},
            format="json",
        )

    def test_logout_deletes_token_and_returns_200(self):
        login_response = self._login()
        token = login_response.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        logout_response = self.client.post(reverse("users:logout"), format="json")
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertFalse(AuthToken.objects.filter(key=token).exists())

    def test_profile_returns_401_after_logout(self):
        login_response = self._login()
        token = login_response.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.client.post(reverse("users:logout"), format="json")

        profile_resp = self.client.post(
            reverse("users:profiles"),
            {"nickname": "x"},
            format="json",
        )
        self.assertEqual(profile_resp.status_code, status.HTTP_401_UNAUTHORIZED)

class EmailVerificationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_send_code_without_email_returns_400(self):
        resp = self.client.post(
            reverse("users:email_verification_reqeust"),
            {},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_wrong_code_returns_400(self):
        email = NEW_EMAIL
        self.client.post(
            reverse("users:email_verification_reqeust"),
            {"email": email},
            format="json",
        )
        resp = self.client.post(
            reverse("users:email_verification_confirm"),
            {"email": email, "code": "000000"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["status"], "FAIL")
        self.assertFalse(cache.get(get_email_verified_cache_key(email)))


class TokenExpiryTests(SignupFlowMixin):
    def setUp(self):
        cache.clear()

    def test_expired_token_returns_401_on_profile(self):
        signup_resp = self._signup()
        token_key = signup_resp.data["token"]

        auth = AuthToken.objects.get(key=token_key)
        auth.expires_at = timezone.now() - timedelta(seconds=1)
        auth.save(update_fields=["expires_at"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token_key}")
        profile_resp = self.client.post(
            reverse("users:profiles"),
            {"nickname": "x"},
            format="json",
        )
        self.assertEqual(profile_resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(AuthToken.objects.filter(key=token_key).exists())
