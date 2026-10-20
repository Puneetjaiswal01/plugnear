import { useEffect, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { type Booking, inr } from "@plugnear/core/domain";
import { db } from "./client";
import { Checkout } from "./Checkout";
import type { Checkout as CheckoutData } from "./upi";
import { Button, Card, Field, s } from "./ui";
export function Bookings({ uid }: { uid: string }) {
  const [items, setItems] = useState<Booking[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dispute, setDispute] = useState(""),
    [reason, setReason] = useState(""),
    [checkout, setCheckout] = useState(""),
    [receipts, setReceipts] = useState<Record<string, CheckoutData>>({}),
    [receiptChecked, setReceiptChecked] = useState<Record<string, boolean>>({});
  async function refresh() {
    const { data, error } = await db!
      .from("bookings")
      .select("*,chargers(title,owner_id)")
      .order("starts_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const bookings = data as Booking[];
    setItems(bookings);
    const details = await Promise.all(
      bookings
        .filter(
          (b) =>
            b.chargers?.owner_id === uid &&
            b.status === "confirmed" &&
            b.payment_status === "reported",
        )
        .map(async (b) => {
          const result = await db!.rpc("get_booking_checkout", {
            p_booking: b.id,
          });
          if (result.error) throw result.error;
          return [b.id, result.data as CheckoutData] as const;
        }),
    );
    setReceipts(Object.fromEntries(details));
  }
  useEffect(() => {
    let active = true;
    const load = () => {
      void refresh().catch((e) => {
        if (active) setError(e.message);
      });
    };
    load();
    const channel = db!
      .channel(`my-bookings-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        load,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") load();
      });
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
      void db!.removeChannel(channel);
    };
  }, [uid]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        throw new Error(
          "An internet connection is required for booking and payment actions.",
        );
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(name: string, args: Record<string, unknown>) {
    await run(async () => {
      const { error } = await db!.rpc(name, args);
      if (error) throw error;
    });
  }
  return (
    <>
      <Text style={s.text}>EVERY CHARGE, IN ONE PLACE</Text>
      <Text style={s.title}>Your bookings.</Text>
      <Button quiet disabled={busy} onPress={() => void run(refresh)}>
        Refresh bookings
      </Button>
      {items.length === 0 && (
        <Card>
          <Text style={s.h2}>Your next charge starts here.</Text>
          <Text style={s.text}>
            Find a charger and request a slot. Host requests also appear here.
          </Text>
        </Card>
      )}
      {!!checkout && (
        <Checkout
          bookingId={checkout}
          onClose={() => setCheckout("")}
          onChange={() => {
            void refresh().catch((e) => setError(e.message));
          }}
        />
      )}
      {items.map((b) => (
        <Card key={b.id}>
          <View style={s.row}>
            <Text style={s.h2}>{b.chargers?.title || "Charger"}</Text>
            <Text style={s.label}>{b.status}</Text>
          </View>
          <Text style={s.text}>
            {new Date(b.starts_at).toLocaleString()} —{" "}
            {new Date(b.ends_at).toLocaleTimeString()}
          </Text>
          <Text style={s.text}>
            {inr(b.amount_paise)} · {b.payment_status} ·{" "}
            {b.driver_id === uid ? "Your charging session" : "Host request"}
          </Text>
          {b.status === "requested" && b.chargers?.owner_id === uid && (
            <>
              <Button
                disabled={busy}
                onPress={() =>
                  void action("respond_to_booking", {
                    p_booking_id: b.id,
                    p_accept: true,
                  })
                }
              >
                Accept request
              </Button>
              <Button
                quiet
                disabled={busy}
                onPress={() =>
                  void action("respond_to_booking", {
                    p_booking_id: b.id,
                    p_accept: false,
                  })
                }
              >
                Decline
              </Button>
            </>
          )}
          {b.driver_id === uid &&
            ["requested", "confirmed"].includes(b.status) &&
            b.payment_status === "unpaid" && (
              <Button
                quiet
                disabled={busy}
                onPress={() =>
                  void action("cancel_my_booking", { p_booking_id: b.id })
                }
              >
                Cancel booking
              </Button>
            )}
          {b.status === "confirmed" &&
            b.driver_id === uid &&
            b.payment_status === "unpaid" && (
              <Button disabled={busy} onPress={() => setCheckout(b.id)}>
                UPI checkout
              </Button>
            )}
          {b.payment_status === "reported" && (
            <Text style={s.text}>
              Payment reported by driver · awaiting host receipt confirmation.
              Not bank-verified.
            </Text>
          )}
          {b.payment_status === "host_confirmed" && (
            <Text style={s.text}>
              Receipt confirmed by host manually · not independently
              bank-verified.
            </Text>
          )}
          {b.status === "confirmed" &&
            b.chargers?.owner_id === uid &&
            b.payment_status === "reported" && (
              <>
                <Text style={s.text}>
                  UPI reference:{" "}
                  {receipts[b.id]?.reported_reference ||
                    "Loading checkout record…"}
                  {"\n"}Recipient: {receipts[b.id]?.upi_vpa || "Loading…"}
                </Text>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: !!receiptChecked[b.id] }}
                  onPress={() =>
                    setReceiptChecked((old) => ({ ...old, [b.id]: !old[b.id] }))
                  }
                  style={{ paddingVertical: 16 }}
                >
                  <Text style={s.text}>
                    {receiptChecked[b.id] ? "☑" : "☐"} I checked my own bank/UPI
                    app and received the full booking amount. A screenshot or
                    driver claim is not proof.
                  </Text>
                </Pressable>
                <Button
                  disabled={busy || !receiptChecked[b.id] || !receipts[b.id]}
                  onPress={() =>
                    void action("confirm_upi_receipt", { p_booking: b.id })
                  }
                >
                  Confirm money received
                </Button>
              </>
            )}
          {b.status === "confirmed" &&
            b.chargers?.owner_id === uid &&
            b.payment_status === "host_confirmed" && (
              <Button
                disabled={busy}
                onPress={() =>
                  void action("start_charging", { p_booking: b.id })
                }
              >
                Start charging session
              </Button>
            )}
          {b.status === "charging" && b.chargers?.owner_id === uid && (
            <Button
              disabled={busy}
              onPress={() =>
                void action("complete_charging", { p_booking: b.id })
              }
            >
              Finish charging session
            </Button>
          )}
          {b.status === "charging" && (
            <Text style={s.text}>
              Charging in progress. The host controls the physical equipment;
              PlugNear does not remotely energise the charger.
            </Text>
          )}
          <Button quiet onPress={() => setDispute(b.id)}>
            Report an issue
          </Button>
        </Card>
      ))}
      {!!dispute && (
        <Card>
          <Text style={s.h2}>Tell us what happened</Text>
          <Field
            label="Issue details (at least 10 characters)"
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Button
            disabled={busy}
            onPress={() =>
              void run(async () => {
                const { error } = await db!
                  .from("disputes")
                  .insert({ booking_id: dispute, opened_by: uid, reason });
                if (error) throw error;
                setDispute("");
                setReason("");
              })
            }
          >
            Submit to support
          </Button>
        </Card>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </>
  );
}
