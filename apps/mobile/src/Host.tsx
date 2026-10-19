import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import * as Location from "expo-location";
import { type Charger } from "@plugnear/core/domain";
import { db } from "./client";
import { Button, Field, Card, s } from "./ui";
export function Host({ uid }: { uid: string }) {
  const [chargers, setChargers] = useState<Charger[]>([]),
    [title, setTitle] = useState(""),
    [address, setAddress] = useState(""),
    [connector, setConnector] = useState("Type 2"),
    [power, setPower] = useState("7.4"),
    [price, setPrice] = useState("15"),
    [legal, setLegal] = useState(""),
    [evidence, setEvidence] = useState(""),
    [verification, setVerification] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [slotCharger, setSlotCharger] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [slots, setSlots] = useState<
      { id: string; charger_id: string; starts_at: string; ends_at: string }[]
    >([]);
  async function refresh() {
    if (!db) return;
    const [c, h] = await Promise.all([
      db
        .from("chargers")
        .select("*")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false }),
      db
        .from("host_verifications")
        .select("status")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    if (c.error) throw c.error;
    if (h.error) throw h.error;
    setChargers(c.data as Charger[]);
    setVerification(h.data?.status || null);
    if (c.data.length) {
      const a = await db
        .from("availability")
        .select("*")
        .in(
          "charger_id",
          c.data.map((x) => x.id),
        )
        .order("starts_at");
      if (a.error) throw a.error;
      setSlots(a.data);
    }
  }
  useEffect(() => {
    void refresh().catch((e) => setMessage(e.message));
  }, [uid]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={s.text}>NEIGHBOURHOOD HOST PILOT</Text>
      <Text style={s.title}>{"Your charger.\nSomeone’s next stop."}</Text>
      <Text style={s.text}>
        We’re prioritising local businesses and parking operators for a future
        electric 2W/3W micro-host pilot.
      </Text>
      <Card>
        <Text style={s.h2}>01 · Get verified</Text>
        <Text style={s.text}>
          Verification: {verification || "not submitted"}. Our team reviews your
          identity and permission to host before approving a charger.
        </Text>
        {!verification && (
          <>
            <Field label="Legal name" value={legal} onChangeText={setLegal} />
            <Field
              label="Hosting evidence and contact details"
              multiline
              placeholder="Describe your site type, hosting permission, electrical inspection evidence, parking access and operating hours. Do not enter Aadhaar or bank details."
              value={evidence}
              onChangeText={setEvidence}
            />
            <Button
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  const { error } = await db!
                    .from("host_verifications")
                    .insert({
                      user_id: uid,
                      legal_name: legal,
                      evidence_note: evidence,
                    });
                  if (error) throw error;
                  setMessage("Verification submitted for manual review.");
                })
              }
            >
              Submit for verification
            </Button>
          </>
        )}
      </Card>
      <Card>
        <Text style={s.h2}>02 · List a charger</Text>
        <Text style={s.text}>
          This prototype accepts only the connector types shown below.
          Socket-based micro-host listings and 2W/3W compatibility checks are
          not enabled yet. A general wall socket is not an approved charging
          point.
        </Text>
        <Field label="Charger name" value={title} onChangeText={setTitle} />
        <Field label="Full address" value={address} onChangeText={setAddress} />
        <Text style={s.label}>Connector</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {["Type 2", "CCS2", "Bharat AC", "CHAdeMO"].map((c) => (
            <Button
              key={c}
              quiet={connector !== c}
              onPress={() => setConnector(c)}
            >
              {c}
            </Button>
          ))}
        </View>
        <Field
          label="Power (kW)"
          keyboardType="decimal-pad"
          value={power}
          onChangeText={setPower}
        />
        <Field
          label="Price per kWh (₹)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />
        <Text style={s.text}>
          Use this button while standing at the charger so drivers get accurate
          directions.
        </Text>
        <Button
          disabled={busy}
          onPress={() =>
            void run(async () => {
              if (
                (await Location.requestForegroundPermissionsAsync()).status !==
                "granted"
              )
                throw Error(
                  "Location permission is required to register your charger.",
                );
              const p = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              const { error } = await db!.from("chargers").insert({
                owner_id: uid,
                title,
                address,
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                connector,
                power_kw: Number(power),
                price_per_kwh: Number(price),
              });
              if (error) throw error;
              setTitle("");
              setAddress("");
              setMessage(
                "Charger submitted. It will appear after host verification and admin approval.",
              );
            })
          }
        >
          {busy ? "Working…" : "Use my location & submit"}
        </Button>
      </Card>
      <Text style={s.h2}>Your chargers</Text>
      {chargers.map((c) => (
        <Card key={c.id}>
          <Text style={s.h2}>{c.title}</Text>
          <Text style={s.text}>
            {c.status} · {c.connector} · ₹{c.price_per_kwh}/kWh
          </Text>
          <Button quiet onPress={() => setSlotCharger(c.id)}>
            Manage availability
          </Button>
          {slots
            .filter((a) => a.charger_id === c.id)
            .map((a) => (
              <View key={a.id} style={{ gap: 8 }}>
                <Text style={s.text}>
                  {new Date(a.starts_at).toLocaleString()} —{" "}
                  {new Date(a.ends_at).toLocaleString()}
                </Text>
                <Button
                  quiet
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      const { error } = await db!
                        .from("availability")
                        .delete()
                        .eq("id", a.id);
                      if (error) throw error;
                    })
                  }
                >
                  Remove window
                </Button>
              </View>
            ))}
        </Card>
      ))}
      {!!slotCharger && (
        <Card>
          <Text style={s.h2}>Publish an availability window</Text>
          <Text style={s.text}>
            Use ISO date and time with timezone, for example
            2026-10-25T09:00:00+05:30. Existing bookings remain reserved when a
            window is removed.
          </Text>
          <Field label="Available from" value={start} onChangeText={setStart} />
          <Field label="Available until" value={end} onChangeText={setEnd} />
          <Button
            disabled={busy}
            onPress={() =>
              void run(async () => {
                if (
                  !Number.isFinite(Date.parse(start)) ||
                  !Number.isFinite(Date.parse(end))
                )
                  throw Error("Enter valid dates with timezone.");
                const { error } = await db!.from("availability").insert({
                  charger_id: slotCharger,
                  starts_at: new Date(start).toISOString(),
                  ends_at: new Date(end).toISOString(),
                });
                if (error) throw error;
                setSlotCharger("");
                setMessage("Availability published.");
              })
            }
          >
            Publish window
          </Button>
        </Card>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={s.text}>
          {message}
        </Text>
      )}
    </>
  );
}
