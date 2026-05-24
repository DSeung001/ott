import { apiFetch } from "./api";
import { normalizeEmail } from "./auth-session";

export type EmailCheckStatus = "AVAILABLE" | "EXIST";

/** Django signup/login API가 반환하는 user 객체 */
export type ApiUser = {
  id: number;
  email: string;
  is_subscribed: boolean;
  is_adult_mode: boolean;
};

export type AuthSuccessResponse = {
  user: ApiUser;
  token: string;
  method: string;
  is_registered: boolean;
  message?: string;
};

export async function checkEmailSignup(email: string): Promise<{
  status: EmailCheckStatus;
  message: string;
}> {
  const normalized = normalizeEmail(email);
  return apiFetch(
    `/api/v1/email/singup_check/?email=${encodeURIComponent(normalized)}`,
  );
}

export async function requestEmailVerification(email: string): Promise<{
  message: string;
}> {
  return apiFetch("/api/v1/email/verity_reqeust", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });
}

export async function confirmEmailVerification(
  email: string,
  code: string,
): Promise<{ status: string; message: string }> {
  return apiFetch("/api/v1/email/verify_confirm", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
      code,
    }),
  });
}

export async function verifyIdentityMock(
  email: string,
  name: string,
  phone: string,
): Promise<{
  status: string;
  message: string;
  data: { name: string; phone: string };
}> {
  return apiFetch("/api/v1/identity/verify_mock/", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
      name,
      phone,
    }),
  });
}

export async function signup(
  email: string,
  password: string,
  passwordConfirm: string,
): Promise<AuthSuccessResponse> {
  return apiFetch("/api/v1/authentications/signup/", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
      password,
      password_confirm: passwordConfirm,
    }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSuccessResponse> {
  return apiFetch("/api/v1/authentications/login/", {
    method: "POST",
    body: JSON.stringify({
      email: normalizeEmail(email),
      password,
    }),
  });
}
