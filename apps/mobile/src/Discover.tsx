import { randomUUID } from "expo-crypto";
import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import * as Location from "expo-location";
import { db } from "./client";
import { Button, Field, Card, s, palette } from "./ui";
import ChargerMap from "./ChargerMap";
import { type Charger, bookingWindow, inr } from "@plugnear/core/domain";
const connectors = ["All", "Type 2", "CCS2", "Bharat AC", "CHAdeMO"];
function distance(a: number, b: number, c: number, d: number) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((c - a) * r) / 2) ** 2 +
    Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function Discover() {
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null),
    [items, setItems] = useState<Charger[]>([]),
    [connector, setConnector] = useState("All"),
    [radius, setRadius] = useState("10"),
    [maxPrice, setMaxPrice] = useState("30"),
    [minPower, setMinPower] = useState("0"),
    [selected, setSelected] = useState<Charger | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [start, setStart] = useState(""),
    [hours, setHours] = useState("1"),
    [kwh, setKwh] = useState("5"),
    [message, setMessage] = useState(""),
    [slots, setSlots] = useState<{ starts_at: string; ends_at: string }[]>([]),
    [requestKey, setRequestKey] = useState<string | null>(null);
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw Error(
          "Allow location to discover chargers around you. You can change this in device settings.",
        );
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPoint({ lat: p.coords.latitude, lon: p.coords.longitude });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!point || !db) return;
    let alive = true;
    setBusy(true);
    const km = Number(radius);
    if (!Number.isFinite(km) || km < 1 || km > 100) {
      setError("Search radius must be 1–100 km.");
      setBusy(false);
      return;
    }
    const delta = km / 111;
    let query = db
      .from("chargers")
      .select("*")
      .eq("status", "approved")
      .gte("latitude", point.lat - delta)
      .lte("latitude", point.lat + delta)
      .gte(
        "longitude",
        point.lon -
          delta / Math.max(0.01, Math.cos((point.lat * Math.PI) / 180)),
      )
      .lte(
        "longitude",
        point.lon +
          delta / Math.max(0.01, Math.cos((point.lat * Math.PI) / 180)),
      )
      .lte("price_per_kwh", Number(maxPrice) || 100)
      .gte("power_kw", Number(minPower) || 0);
    if (connector !== "All") query = query.eq("connector", connector);
    void query.limit(200).then(({ data, error }) => {
      if (!alive) return;
      if (error) setError(error.message);
      else {
        setError("");
        setItems(
          (data as Charger[])
            .map((c) => ({
              ...c,
              distance_km: distance(
                point.lat,
                point.lon,
                c.latitude,
                c.longitude,
              ),
            }))
            .filter((c) => c.distance_km <= km)
            .sort((a, b) => a.distance_km - b.distance_km),
        );
      }
      setBusy(false);
    });
    return () => {
      alive = false;
    };
  }, [point, connector, radius, maxPrice, minPower]);
  useEffect(() => {
    setSlots([]);
    setRequestKey(null);
    setMessage("");
    if (!selected || !db) return;
    let alive = true;
    void db
      .from("availability")
      .select("starts_at,ends_at")
      .eq("charger_id", selected.id)
      .gt("ends_at", new Date().toISOString())
      .order("starts_at")
      .then(({ data, error }) => {
        if (alive) {
          if (error) setError(error.message);
          else setSlots(data || []);
        }
      });
    return () => {
      alive = false;
    };
  }, [selected]);
  async function book() {
    if (!db || !selected) return;
    setBusy(true);
    setError("");
    try {
      const window = bookingWindow(start, Number(hours));
      const key = requestKey || randomUUID();
      setRequestKey(key);
      const { error } = await db.rpc("reserve_charger", {
        p_charger: selected.id,
        p_start: window.starts_at,
        p_end: window.ends_at,
        p_kwh: Number(kwh),
        p_key: key,
      });
      if (error) throw error;
      setMessage(
        "Request sent. Your slot is reserved while the host reviews it. View progress in Bookings.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <View>
        <Text style={s.text}>YOUR NEXT STOP, SORTED</Text>
        <Text style={s.title}>{"A little closer.\nA lot more charged."}</Text>
        <Text style={s.text}>
          Find a trusted charger in your neighbourhood.
        </Text>
      </View>
      <Button disabled={busy} onPress={() => void locate()}>
        {busy
          ? "Finding your next charge…"
          : point
            ? "Refresh my location"
            : "Find chargers near me"}
      </Button>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {connectors.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            onPress={() => setConnector(c)}
            style={[
              s.pill,
              connector === c && { backgroundColor: palette.lime },
            ]}
          >
            <Text style={s.label}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Field
            label="Within (km)"
            keyboardType="numeric"
            value={radius}
            onChangeText={setRadius}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Max ₹/kWh"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Min kW"
            keyboardType="numeric"
            value={minPower}
            onChangeText={setMinPower}
          />
        </View>
      </View>
      {point && (
        <ChargerMap
          lat={point.lat}
          lon={point.lon}
          chargers={items}
          onSelect={setSelected}
        />
      )}
      <Text style={s.h2}>{items.length} chargers nearby</Text>
      {point && !busy && items.length === 0 && (
        <Card>
          <Text style={s.h2}>Room for a new connection.</Text>
          <Text style={s.text}>
            No approved chargers match this search yet. Try a wider radius or
            list your own charger.
          </Text>
        </Card>
      )}
      {items.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => setSelected(c)}
          accessibilityRole="button"
        >
          <Card>
            <View style={s.row}>
              <Text style={s.h2}>{c.title}</Text>
              <Text style={s.label}>₹{c.price_per_kwh}/kWh</Text>
            </View>
            <Text style={s.text}>
              {c.connector} · {c.power_kw} kW · {c.distance_km?.toFixed(1)} km
              away
            </Text>
            <Text style={s.text}>{c.address}</Text>
            <Text style={s.label}>View availability →</Text>
          </Card>
        </Pressable>
      ))}
      {selected && (
        <Card>
          <Text style={s.h2}>{selected.title}</Text>
          <Button
            quiet
            onPress={() =>
              void Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}&travelmode=driving`,
              )
            }
          >
            Get directions ↗
          </Button>
          <Text style={s.label}>Host availability</Text>
          {slots.map((a, i) => (
            <Text key={i} style={s.text}>
              {new Date(a.starts_at).toLocaleString()} —{" "}
              {new Date(a.ends_at).toLocaleString()}
            </Text>
          ))}
          {slots.length === 0 && (
            <Text style={s.text}>
              The host has not published an upcoming slot.
            </Text>
          )}
          <Field
            label="Start (date and time with timezone)"
            placeholder="2026-10-25T10:00:00+05:30"
            value={start}
            onChangeText={(v) => {
              setStart(v);
              setRequestKey(null);
              setMessage("");
            }}
          />
          <Field
            label="Duration (hours)"
            value={hours}
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              setHours(v);
              setRequestKey(null);
              setMessage("");
            }}
          />
          <Field
            label="Energy to reserve (kWh)"
            value={kwh}
            keyboardType="decimal-pad"
            onChangeText={(v) => {
              setKwh(v);
              setRequestKey(null);
              setMessage("");
            }}
          />
          <Text style={s.text}>
            Estimate {inr(Number(kwh) * selected.price_per_kwh * 100)} ·
            confirmed by the server. Payment is not collected at this stage.
          </Text>
          <Button
            disabled={busy || !!message || slots.length === 0}
            onPress={() => void book()}
          >
            Request this charger
          </Button>
          {!!message && <Text style={s.text}>{message}</Text>}
          <Button quiet onPress={() => setSelected(null)}>
            Close
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
