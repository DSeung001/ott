const SIGNUP_EMAIL_KEY = "ott_signup_email";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function setSignupEmail(email: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SIGNUP_EMAIL_KEY, normalizeEmail(email));
}

export function getSignupEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SIGNUP_EMAIL_KEY);
}

export function clearSignupEmail(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
}
