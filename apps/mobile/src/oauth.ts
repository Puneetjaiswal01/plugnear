import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { db } from "./client";
import { nativeCallbackCode } from "./auth-input";
WebBrowser.maybeCompleteAuthSession();
export function authRedirect(): string {
  if (Platform.OS !== "web") return "plugnear://auth/callback";
  const mode = new URLSearchParams(window.location.search).get("mode");
  return `${window.location.origin}/app/${mode === "host" ? "?mode=host" : ""}`;
}
// Browser result and native deep-link events may deliver the same callback.
const exchanges = new Map<string, Promise<void>>();
export async function completeNativeAuth(url: string): Promise<void> {
  const code = nativeCallbackCode(url);
  if (!code) return;
  const flowId = new URL(url).searchParams.get("sb_flow_id");
  const exchangeKey = `${flowId || ""}:${code}`;
  let exchange = exchanges.get(exchangeKey);
  if (!exchange) {
    exchange = (async () => {
      const { error } = await db!.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (error)
        throw new Error(
          "Sign-in link expired or could not be verified. Please try signing in again.",
        );
    })();
    exchanges.set(exchangeKey, exchange);
    if (exchanges.size > 10) exchanges.delete(exchanges.keys().next().value!);
  }
  await exchange;
}
export async function socialSignIn(
  provider: "google" | "apple",
): Promise<void> {
  const redirectTo = authRedirect();
  const { data, error } = await db!.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  });
  if (error) throw error;
  if (Platform.OS !== "web") {
    if (!data.url) throw new Error("Sign-in is currently unavailable.");
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success") await completeNativeAuth(result.url);
    else throw new Error("Sign-in cancelled. You can try again or use email.");
  }
}
