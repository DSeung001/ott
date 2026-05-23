CACHE_PREFIX = "ott:users"
AUTH_CODE_TIMEOUT = 300
EMAIL_VERIFIED_TIMEOUT = 600
IDENTITY_VERIFIED_TIMEOUT = 600

def _normalize_email(email: str) -> str:
    return email.strip().lower()

def get_auth_code_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:auth_code:{_normalize_email(email)}"

def get_email_verified_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:email_verified:{_normalize_email(email)}"

def get_identity_verified_cache_key(email: str) -> str:
    return f"{CACHE_PREFIX}:identity_verified:{_normalize_email(email)}"
