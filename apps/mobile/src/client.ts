import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { sessionFetch, hasSessionToken } from "./session-fetch";
import { requirePlugNear } from "@plugnear/core/domain";
const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://yxisoddhwlzetrnfbbno.supabase.co";
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export const configured = !!key;
if (configured) requirePlugNear(url, key);
const storage =
  Platform.OS === "web"
    ? undefined
    : {
        async getItem(k: string) {
          const manifest = await SecureStore.getItemAsync(k);
          if (!manifest) return null;
          const { id, n } = JSON.parse(manifest) as { id: string; n: number };
          const parts = await Promise.all(
            Array.from({ length: n }, (_, i) =>
              SecureStore.getItemAsync(`${k}.${id}.${i}`),
            ),
          );
          return parts.every((x) => x !== null) ? parts.join("") : null;
        },
        async setItem(k: string, v: string) {
          const old = await SecureStore.getItemAsync(k);
          const id =
            Date.now().toString(36) + Math.random().toString(36).slice(2);
          const n = Math.ceil(v.length / 1500);
          for (let i = 0; i < n; i++)
            await SecureStore.setItemAsync(
              `${k}.${id}.${i}`,
              v.slice(i * 1500, (i + 1) * 1500),
            );
          await SecureStore.setItemAsync(k, JSON.stringify({ id, n }));
          if (old) {
            const o = JSON.parse(old);
            for (let i = 0; i < o.n; i++)
              await SecureStore.deleteItemAsync(`${k}.${o.id}.${i}`);
          }
        },
        async removeItem(k: string) {
          const old = await SecureStore.getItemAsync(k);
          await SecureStore.deleteItemAsync(k);
          if (old) {
            const o = JSON.parse(old);
            for (let i = 0; i < o.n; i++)
              await SecureStore.deleteItemAsync(`${k}.${o.id}.${i}`);
          }
        },
      };
const sessionRequiredListeners = new Set<() => void>();
export function onSessionRequired(listener: () => void) {
  sessionRequiredListeners.add(listener);
  return () => {
    sessionRequiredListeners.delete(listener);
  };
}
function requireSignIn() {
  // Run outside the Auth lock/callback stack. Never log or expose tokens.
  queueMicrotask(() =>
    sessionRequiredListeners.forEach((listener) => listener()),
  );
}
export function usableSession(session: Parameters<typeof hasSessionToken>[0]) {
  return hasSessionToken(session, key);
}
export const db = configured
  ? createClient(url, key, {
      global: { fetch: sessionFetch(url, key, requireSignIn) },
      auth: {
        storage,
        flowType: "pkce",
        lock: processLock,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    })
  : null;
if (Platform.OS !== "web" && db) {
  AppState.addEventListener("change", (s) => {
    if (s === "active") db.auth.startAutoRefresh();
    else db.auth.stopAutoRefresh();
  });
}

export async function publicAuthSettings(): Promise<{
  google: boolean;
  apple: boolean;
  phone: boolean;
}> {
  const response = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: key },
  });
  if (!response.ok) throw new Error("Authentication settings unavailable.");
  const settings = await response.json();
  return {
    google: settings.external?.google === true,
    apple: settings.external?.apple === true,
    phone: settings.external?.phone === true,
  };
}
