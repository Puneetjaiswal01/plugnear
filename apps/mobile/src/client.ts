import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
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
export const db = configured
  ? createClient(url, key, {
      auth: {
        storage,
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
