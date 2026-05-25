from django.urls import path, include

from .views import EmailVerificationRequest, EmailVerificationConfirm, IdentityVerificationMockView, SignUpView, \
    ProfilesView, EmailSignUpCheck, LoginView, LogoutView, ProfileDetailView, MembershipView

app_name = "users"

v1_patterns = [
    path('email/singup_check/', EmailSignUpCheck.as_view(), name='email_signup_check'),
    path('email/verity_reqeust', EmailVerificationRequest.as_view(), name='email_verification_reqeust'),
    path('email/verify_confirm', EmailVerificationConfirm.as_view(), name='email_verification_confirm'),
    path('identity/verify_mock/', IdentityVerificationMockView.as_view(), name='identity_verify_mock'),
    path('authentications/signup/', SignUpView.as_view(), name='signup'),
    path('authentications/login/', LoginView.as_view(), name='login'),
    path('authentications/logout/', LogoutView.as_view(), name='logout'),
    path('profiles/', ProfilesView.as_view(), name='profiles'),
    path('profiles/<int:pk>/', ProfileDetailView.as_view(), name='profiles_detail'),
    path('membership/', MembershipView.as_view(), name='membership'),
]

urlpatterns = [
    path('v1/', include(v1_patterns)),
]
