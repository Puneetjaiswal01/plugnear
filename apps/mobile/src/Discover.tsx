import { randomUUID } from "expo-crypto";
import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import * as Location from "expo-location";
import { db } from "./client";
import { Button, Field, Card, s, palette } from "./ui";
import ChargerMap from "./ChargerMap";
import type { MapPoint } from "./map-types";
const delhiNcr = { lat: 28.6139, lon: 77.209 };
import { type Charger, bookingWindow, inr } from "@plugnear/core/domain";
const connectors = ["All", "Type 2", "CCS2", "Bharat AC", "CHAdeMO"];
export function Discover() {
  const [point, setPoint] = useState<MapPoint | null>(null),
    [mapCenter, setMapCenter] = useState<MapPoint>(delhiNcr),
    [showUserLocation, setShowUserLocation] = useState(false),
    [mapError, setMapError] = useState(""),
    [items, setItems] = useState<Charger[]>([]),
    [connector, setConnector] = useState("All"),
    [radius, setRadius] = useState("10"),
    [maxPrice, setMaxPrice] = useState("30"),
    [minPower, setMinPower] = useState("0"),
    [selected, setSelected] = useState<Charger | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [start, setStart] = useState(() =>
      new Date(Date.now() + 5 * 60000).toISOString(),
    ),
    [hours, setHours] = useState("1"),
    [kwh, setKwh] = useState("5"),
    [message, setMessage] = useState(""),
    [slots, setSlots] = useState<{ starts_at: string; ends_at: string }[]>([]),
    [requestKey, setRequestKey] = useState<string | null>(null),
    [connection, setConnection] = useState("Not connected"),
    [updated, setUpdated] = useState("");
  async function locate() {
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setShowUserLocation(false);
        throw Error(
          "Location permission is off. Move the map and choose Search this map area, or enable location in your browser/device settings.",
        );
      }
      setShowUserLocation(true);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const p = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "Location took too long. Search a map area instead, or try GPS again.",
                ),
              ),
            15000,
          );
        }),
      ]).finally(() => {
        if (timer) clearTimeout(timer);
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
    const client = db;
    let alive = true,
      sequence = 0;
    let pending: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      const seq = ++sequence;
      setBusy(true);
      try {
        const km = Number(radius),
          price = Number(maxPrice),
          power = Number(minPower);
        if (
          !Number.isFinite(km) ||
          km < 1 ||
          km > 100 ||
          !Number.isFinite(price) ||
          price < 0 ||
          price > 100 ||
          !Number.isFinite(power) ||
          power < 0 ||
          power > 500
        )
          throw new Error(
            "Check radius (1–100 km), price (0–100) and power (0–500 kW).",
          );
        if (typeof navigator !== "undefined" && navigator.onLine === false)
          throw new Error(
            "You are offline. Live availability and requests need an internet connection.",
          );
        const { data, error } = await client.rpc("get_nearby_chargers", {
          p_lat: point!.lat,
          p_lon: point!.lon,
          p_radius_km: km,
          p_connector: connector === "All" ? null : connector,
          p_max_price: price,
          p_min_power: power,
          p_limit: 50,
        });
        if (error) throw error;
        if (alive && seq === sequence) {
          const next = data as Charger[];
          setItems(next);
          setSelected((old) =>
            old ? next.find((c) => c.id === old.id) || null : null,
          );
          setUpdated(new Date().toLocaleTimeString());
          setError("");
        }
      } catch (e) {
        if (alive && seq === sequence) {
          setError((e as Error).message);
          setItems([]);
          setSelected(null);
        }
      } finally {
        if (alive && seq === sequence) setBusy(false);
      }
    }
    const schedule = () => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => void load(), 250);
    };
    void load();
    const channel = client
      .channel("nearby-charger-availability")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chargers" },
        schedule,
      )
      .subscribe((status) => {
        if (alive) {
          setConnection(
            status === "SUBSCRIBED"
              ? "Live updates connected"
              : "Reconnecting · periodic refresh active",
          );
          if (status === "SUBSCRIBED") schedule();
        }
      });
    const interval = setInterval(() => void load(), 15000);
    if (typeof window !== "undefined") {
      window.addEventListener("online", schedule);
      window.addEventListener("focus", schedule);
      window.addEventListener("offline", schedule);
    }
    return () => {
      alive = false;
      clearInterval(interval);
      if (pending) clearTimeout(pending);
      void client.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", schedule);
        window.removeEventListener("focus", schedule);
        window.removeEventListener("offline", schedule);
      }
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
  }, [selected?.id]);
  async function book() {
    if (!db || !selected) return;
    setBusy(true);
    setError("");
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        throw new Error("Connect to the internet before requesting a charger.");
      if (selected.availability_status !== "available")
        throw new Error(
          "This charger is not available now. Refresh nearby chargers.",
        );
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
      <Text style={s.text}>
        {point
          ? "Blue marks the search location. Move the map to explore another area."
          : "Map starts in Delhi NCR, not your GPS location. Move it to an area and search, or use the location button above."}
      </Text>
      <ChargerMap
        lat={point?.lat ?? delhiNcr.lat}
        lon={point?.lon ?? delhiNcr.lon}
        chargers={items}
        selectedId={selected?.id}
        showSearchLocation={!!point}
        showUserLocation={showUserLocation}
        onSelect={setSelected}
        onCenterChange={setMapCenter}
        onMapError={setMapError}
      />
      <Button
        quiet
        disabled={busy}
        onPress={() => {
          if (
            !Number.isFinite(mapCenter.lat) ||
            !Number.isFinite(mapCenter.lon) ||
            Math.abs(mapCenter.lat) > 90 ||
            Math.abs(mapCenter.lon) > 180
          ) {
            setError("Choose a map area within the supported coordinates.");
            return;
          }
          setError("");
          setPoint({ ...mapCenter });
        }}
      >
        Search this map area
      </Button>
      {!!mapError && (
        <Text accessibilityRole="alert" style={s.error}>
          {mapError}
        </Text>
      )}
      <Text style={s.text}>
        {connection}
        {updated ? ` · Checked ${updated}` : ""}. Green: available · amber: busy
        · grey: offline.
      </Text>
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
            <Text style={s.label}>
              {c.availability_status || "Check availability"} · View charger →
            </Text>
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
              ).catch(() =>
                setError(
                  "Directions could not open. Use the listed address in your navigation app.",
                ),
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
          <Text style={s.text}>
            Pilot request: one hour, starting in about five minutes. The server
            rechecks availability before reserving.
          </Text>
          <Button
            quiet
            onPress={() => {
              setStart(new Date(Date.now() + 5 * 60000).toISOString());
              setRequestKey(null);
              setMessage("");
            }}
          >
            Use the next hour
          </Button>
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
            confirmed by the server. After host acceptance, pay the host
            directly by UPI and wait for receipt confirmation.
          </Text>
          <Button
            disabled={
              busy ||
              !!message ||
              slots.length === 0 ||
              selected.availability_status !== "available"
            }
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
