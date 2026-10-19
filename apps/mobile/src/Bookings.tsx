import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { type Booking, inr } from "@plugnear/core/domain";
import { db } from "./client";
import { Button, Card, Field, s } from "./ui";
export function Bookings({ uid }: { uid: string }) {
  const [items, setItems] = useState<Booking[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dispute, setDispute] = useState(""),
    [reason, setReason] = useState("");
  async function refresh() {
    const { data, error } = await db!
      .from("bookings")
      .select("*,chargers(title,owner_id)")
      .order("starts_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    setItems(data as Booking[]);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, [uid]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
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
            ["requested", "confirmed"].includes(b.status) && (
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
          {b.status === "confirmed" && (
            <Text style={s.text}>
              Online payment is not available yet. Do not send money outside
              PlugNear.
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
