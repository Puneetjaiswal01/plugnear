export const PROJECT_REF = "yxisoddhwlzetrnfbbno";
export type Connector = "Type 2" | "CCS2" | "Bharat AC" | "CHAdeMO";
export type Charger = {
  id: string;
  owner_id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  connector: Connector;
  power_kw: number;
  price_per_kwh: number;
  status: string;
  distance_km?: number;
  availability_status?: "available" | "busy" | "offline";
  operational_status?: "available" | "offline";
  availability_revision?: number;
};
export type Booking = {
  id: string;
  charger_id: string;
  driver_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount_paise: number;
  payment_status: string;
  chargers?: { title: string; owner_id: string };
};
export function inr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
export function requirePlugNear(url: string, key: string) {
  if (new URL(url).hostname !== `${PROJECT_REF}.supabase.co`)
    throw new Error(
      "Only the dedicated PlugNear Supabase project is permitted.",
    );
  if (!key || (!key.startsWith("sb_publishable_") && !key.startsWith("eyJ")))
    throw new Error("Configure the PlugNear publishable key.");
}
export function bookingWindow(start: string, hours: number) {
  if (!/T.+(?:Z|[+-]\d{2}:\d{2})$/.test(start))
    throw new Error("Include a timezone in the start date.");
  const t = Date.parse(start);
  if (
    !Number.isFinite(t) ||
    t <= Date.now() ||
    !Number.isFinite(hours) ||
    hours < 0.5 ||
    hours > 12
  )
    throw new Error(
      "Choose a future start and a duration between 0.5 and 12 hours.",
    );
  return {
    starts_at: new Date(t).toISOString(),
    ends_at: new Date(t + hours * 3600000).toISOString(),
  };
}
