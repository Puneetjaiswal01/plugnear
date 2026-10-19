export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, "");
  const phone = /^[6-9]\d{9}$/.test(compact) ? `+91${compact}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new Error(
      "Enter a 10-digit Indian mobile number or an international number beginning with +.",
    );
  }
  return phone;
}
export function nativeCallbackCode(value: string): string | null {
  const url = new URL(value);
  if (
    url.protocol !== "plugnear:" ||
    url.hostname !== "auth" ||
    url.pathname !== "/callback"
  )
    return null;
  if (url.searchParams.has("error"))
    throw new Error("Sign-in was not completed. Please try again.");
  return url.searchParams.get("code");
}
