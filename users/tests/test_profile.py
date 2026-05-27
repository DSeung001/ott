from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.constants import DEFAULT_AVATAR_FILE
from users.models import Profile
from users.tests.utils import SignupFlowMixin

User = get_user_model()

class ProfileAuthTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_profile_without_token_returns_401(self):
        resp = self.client.post(
            reverse("users:profiles"),
            {"nickname": "x"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_with_invalid_token_returns_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + "0" * 40)
        resp = self.client.post(
            reverse("users:profiles"),
            {"nickname": "x"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

class ProfileUpdateTests(SignupFlowMixin):
    def test_patch_profile_updates_nickname_and_is_adult_mode(self):
        self.signup_and_auth()
        create_resp = self.client.post(
            reverse("users:profiles"),
            {
                "nickname": "테스트",
                "avatar_file": DEFAULT_AVATAR_FILE,
                "is_adult_mode": False,
            },
            format="json",
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED, create_resp.data)
        profile_id = create_resp.data["profile"]["id"]
        patch_resp = self.client.patch(
            reverse("users:profiles_detail", kwargs={"pk": profile_id}),
            {
                "nickname": "수정됨",
                "is_adult_mode": True,
            },
            format="json",
        )
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK, patch_resp.data)
        self.assertEqual(patch_resp.data["profile"]["nickname"], "수정됨")
        self.assertEqual(patch_resp.data["profile"]["is_adult_mode"], True)
        profile = Profile.objects.get(pk=profile_id)
        self.assertEqual(profile.nickname, "수정됨")
        self.assertTrue(profile.is_adult_mode)