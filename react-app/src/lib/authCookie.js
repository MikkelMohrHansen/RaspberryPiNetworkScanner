export function setAuthSessionCookie() {
  document.cookie = "auth=1; Path=/; SameSite=Lax";
}

export function clearAuthCookie() {
  document.cookie = "auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function hasAuthCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("auth="));
}
