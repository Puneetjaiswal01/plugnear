export type MarketCode = "IN" | "AE";
export type Market = Readonly<{
  code: MarketCode;
  name: string;
  area: string;
  currency: "INR" | "AED";
  locale: string;
  timeZone: string;
  bookingMode: "india-pilot" | "partnership-only";
  enquiryPath: string;
}>;
export const MARKETS: Readonly<Record<MarketCode, Market>>;
export function getMarket(code: string): Market;
export function marketMoney(code: string, minorUnits: number): string;
export function marketTime(code: string, value: string | number | Date): string;
export function assertBookingMarket(code: string): Market;
