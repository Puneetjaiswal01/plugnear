/** Public presentation/planning settings, not server authorization or launch approval. */
export const MARKETS = Object.freeze({
  IN: Object.freeze({
    code: "IN",
    name: "India",
    area: "Delhi NCR",
    currency: "INR",
    locale: "en-IN",
    timeZone: "Asia/Kolkata",
    bookingMode: "india-pilot",
    enquiryPath: "/#pilot-enquiry",
  }),
  AE: Object.freeze({
    code: "AE",
    name: "United Arab Emirates",
    area: "Dubai",
    currency: "AED",
    locale: "en-AE",
    timeZone: "Asia/Dubai",
    bookingMode: "partnership-only",
    enquiryPath: "/dubai/#dubai-enquiry",
  }),
});
export function getMarket(code) {
  if (typeof code !== "string" || !Object.hasOwn(MARKETS, code))
    throw new Error("Choose India or Dubai. This region is not configured.");
  return MARKETS[code];
}
export function marketMoney(code, minorUnits) {
  const market = getMarket(code);
  if (!Number.isSafeInteger(minorUnits))
    throw new Error("Use a safe integer amount in minor currency units.");
  return new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}
export function marketTime(code, value) {
  const market = getMarket(code),
    date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Enter a valid date.");
  return new Intl.DateTimeFormat(market.locale, {
    timeZone: market.timeZone,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
export function assertBookingMarket(code) {
  const market = getMarket(code);
  if (market.bookingMode !== "india-pilot")
    throw new Error(
      "Dubai is open for partnership enquiries only. Booking and payment are not available.",
    );
  return market;
}
