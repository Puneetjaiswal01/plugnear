export type Checkout = {
  booking_id: string;
  upi_vpa: string;
  payee_name: string;
  amount_paise: number;
  currency: string;
  reference: string;
  payment_status: string;
  bank_verified: boolean;
  reported_reference?: string;
};
export function upiUri(value: Checkout): string {
  if (
    !/^[A-Za-z0-9._-]{2,128}@[A-Za-z0-9.-]{2,64}$/.test(value.upi_vpa) ||
    !value.payee_name.trim() ||
    value.payee_name.length > 100 ||
    !Number.isSafeInteger(value.amount_paise) ||
    value.amount_paise <= 0 ||
    value.currency !== "INR" ||
    !/^[0-9a-f-]{36}$/i.test(value.booking_id)
  )
    throw new Error(
      "Invalid checkout details. Refresh the booking before paying.",
    );
  const params = new URLSearchParams({
    pa: value.upi_vpa,
    pn: value.payee_name,
    am: (value.amount_paise / 100).toFixed(2),
    cu: "INR",
    tn: `PlugNear ${value.booking_id}`,
    tr: value.booking_id,
  });
  return `upi://pay?${params.toString()}`;
}
