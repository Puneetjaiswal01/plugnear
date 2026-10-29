import { marketTime } from "@plugnear/core/markets";
/** Client planning only. Reservation authority and pricing remain on the server. */
export type AvailabilityWindow = { starts_at: string; ends_at: string };
export function earliestStart(slot: AvailabilityWindow, now = Date.now()) {
  const starts = Date.parse(slot.starts_at),
    ends = Date.parse(slot.ends_at);
  if (!Number.isFinite(starts) || !Number.isFinite(ends) || ends <= starts)
    throw Error("The host window is invalid. Refresh availability.");
  const candidate = Math.max(starts, now + 5 * 60000);
  if (ends - candidate < 30 * 60000)
    throw Error(
      "This window has less than 30 minutes left. Choose another window.",
    );
  return new Date(candidate).toISOString();
}
export function sessionEstimate(
  start: string,
  hours: number,
  kwh: number,
  rate: number,
  slots: AvailabilityWindow[],
  now = Date.now(),
) {
  const begins = Date.parse(start),
    ends = begins + hours * 3600000;
  if (
    !Number.isFinite(begins) ||
    begins <= now ||
    !Number.isFinite(hours) ||
    hours < 0.5 ||
    hours > 12
  )
    throw Error(
      "Choose a future start and a duration between 0.5 and 12 hours.",
    );
  if (
    !Number.isFinite(kwh) ||
    kwh <= 0 ||
    kwh > 500 ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100
  )
    throw Error(
      "Enter energy above 0 and up to 500 kWh, with a valid listed rate.",
    );
  if (
    !slots.some(
      (slot) =>
        Date.parse(slot.starts_at) <= begins &&
        Date.parse(slot.ends_at) >= ends,
    )
  )
    throw Error(
      "Your session must fit inside one host availability window. Shorten the duration or choose another window.",
    );
  return {
    starts_at: new Date(begins).toISOString(),
    ends_at: new Date(ends).toISOString(),
    amount_paise: Math.round(kwh * rate * 100),
  };
}
export function indiaTime(value: string) {
  return marketTime("IN", value);
}
