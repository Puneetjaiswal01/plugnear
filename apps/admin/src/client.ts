import { createClient } from "@supabase/supabase-js";
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://yxisoddhwlzetrnfbbno.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (new URL(url).hostname !== "yxisoddhwlzetrnfbbno.supabase.co")
  throw new Error("Only the dedicated PlugNear project is allowed.");
export const db = key
  ? createClient(url, key, {
      auth: { persistSession: false, detectSessionInUrl: false },
    })
  : null;
