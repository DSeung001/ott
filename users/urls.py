from django.urls import path, include

from .views import EmailVerificationRequest, EmailVerificationConfirm, IdentityVerificationMockView, SignUpView, \
    MyProfileView, EmailSignUpCheck

app_name = "users"

v1_patterns = [
    path('email/singup_check/', EmailSignUpCheck.as_view(), name='email_signup_check'),
    path('email/verity_reqeust', EmailVerificationRequest.as_view(), name='email_verification_reqeust'),
    path('email/verify_confirm', EmailVerificationConfirm.as_view(), name='email_verification_confirm'),
    path('identity/verify_mock/', IdentityVerificationMockView.as_view(), name='identity_verify_mock'),
    path('authentications/signup/', SignUpView.as_view(), name='signup'),
    path('profiles/', MyProfileView.as_view(), name='my_profile'),
]

urlpatterns = [
    path('v1/', include(v1_patterns)),
]
