import { useEffect, useState } from "react";
import { Linking, Text } from "react-native";
import { db } from "./client";
import { Button, Card, Field, s } from "./ui";
import { inr } from "@plugnear/core/domain";
import { upiUri, type Checkout as CheckoutData } from "./upi";
import { UpiQr } from "./UpiQr";
export function Checkout({
  bookingId,
  onChange,
  onClose,
}: {
  bookingId: string;
  onChange: () => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<CheckoutData | null>(null),
    [reference, setReference] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void db!
      .rpc("get_booking_checkout", { p_booking: bookingId })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setData(data as CheckoutData);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);
  let uri = "",
    validationError = "";
  try {
    if (data) uri = upiUri(data);
  } catch (e) {
    validationError = (e as Error).message;
  }
  async function report() {
    setBusy(true);
    setError("");
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        throw Error("An internet connection is required.");
      const { error } = await db!.rpc("report_upi_payment", {
        p_booking: bookingId,
        p_reference: reference.trim(),
      });
      if (error) throw error;
      onChange();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Text style={s.h2}>UPI checkout · direct to host</Text>
      {data && uri && (
        <>
          <Text style={s.text}>
            Recipient: {data.payee_name}
            {"\n"}UPI address: {data.upi_vpa}
            {"\n"}Amount: {inr(data.amount_paise)}
          </Text>
          <UpiQr uri={uri} />
          <Button
            disabled={busy || data.payment_status !== "unpaid"}
            onPress={() => {
              if (
                typeof navigator !== "undefined" &&
                navigator.onLine === false
              ) {
                setError("Connect to the internet before opening checkout.");
                return;
              }
              void Linking.openURL(uri).catch(() =>
                setError(
                  "No UPI app opened. Scan the QR from another device or use the displayed host VPA and exact amount.",
                ),
              );
            }}
          >
            Open UPI app
          </Button>
          <Text style={s.text}>
            Verify the recipient name, VPA and amount in your UPI app. Opening
            checkout does not prove payment. PlugNear does not verify the bank
            transfer or hold these funds. Do not pay twice; check your bank/UPI
            history if the result is unclear.
          </Text>
          <Field
            label="UPI transaction reference"
            value={reference}
            onChangeText={setReference}
            autoCapitalize="none"
          />
          <Button
            disabled={
              busy ||
              data.payment_status !== "unpaid" ||
              !/^[A-Za-z0-9_-]{6,64}$/.test(reference.trim())
            }
            onPress={() => void report()}
          >
            I transferred · ask host to confirm
          </Button>
          <Text style={s.text}>
            This records your claim only. The host must check actual receipt in
            their own bank/UPI app before starting the session. Refunds and
            payment disputes require the host and support; no automatic refund
            is provided.
          </Text>
        </>
      )}
      {!!(error || validationError) && (
        <Text accessibilityRole="alert" style={s.error}>
          {error || validationError}
        </Text>
      )}
      <Button quiet disabled={busy} onPress={onClose}>
        Close checkout
      </Button>
    </Card>
  );
}
