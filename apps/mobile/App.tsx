import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { db, configured, onSessionRequired, usableSession } from "./src/client";
import { Card, s, palette } from "./src/ui";
import { Discover } from "./src/Discover";
import { Host } from "./src/Host";
import { Bookings } from "./src/Bookings";
import { Account } from "./src/Account";
import { Auth } from "./src/Auth";
import { PwaStatus } from "./src/PwaStatus";
import { PasswordRecovery } from "./src/PasswordRecovery";
import { SESSION_REQUIRED } from "./src/session-fetch";
import { completeNativeAuth } from "./src/oauth";
import { MarketEntry } from "./src/MarketEntry";
import { type MarketCode } from "@plugnear/core/markets";
function entryMarket(): MarketCode | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return "IN";
  const value = new URLSearchParams(window.location.search).get("market");
  return value === null || value === "IN" ? "IN" : value === "AE" ? "AE" : null;
}
function entryTab(): "Find a charger" | "List a charger" {
  return Platform.OS === "web" &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "host"
    ? "List a charger"
    : "Find a charger";
}
const tabs = [
  "Find a charger",
  "List a charger",
  "Bookings",
  "Account",
] as const;
export default function App() {
  const [market] = useState(entryMarket);
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState<(typeof tabs)[number]>(entryTab),
    [authError, setAuthError] = useState(""),
    [recovering, setRecovering] = useState(false);
  useEffect(() => {
    if (market !== "IN" || !db) {
      setReady(true);
      return;
    }
    const client = db;
    let active = true;
    let clearingSession = false;
    const stopSessionRecovery = onSessionRequired(() => {
      if (!active) return;
      setSession(null);
      setRecovering(false);
      setAuthError(SESSION_REQUIRED);
      if (!clearingSession) {
        clearingSession = true;
        void client.auth
          .signOut({ scope: "local" })
          .catch(() => {})
          .finally(() => {
            clearingSession = false;
          });
      }
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      if (!active) return;
      setSession(usableSession(data.session) ? data.session : null);
      setReady(true);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, value) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_OUT") setRecovering(false);
      const signedIn = usableSession(value);
      setSession(signedIn ? value : null);
      if (signedIn) setAuthError("");
      setTab(entryTab());
    });
    async function handle(url: string) {
      try {
        await completeNativeAuth(url);
      } catch (e) {
        setAuthError((e as Error).message);
      }
    }
    const link = Linking.addEventListener("url", (e) => void handle(e.url));
    void Linking.getInitialURL().then((url) => {
      if (url) void handle(url);
    });
    return () => {
      active = false;
      stopSessionRecovery();
      subscription.unsubscribe();
      link.remove();
    };
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.page}>
        <StatusBar style="dark" />
        <View
          style={{
            paddingHorizontal: 22,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: palette.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: 180, height: 42, overflow: "hidden" }}>
            <Image
              source={require("./assets/brand/logo.png")}
              accessibilityLabel="PlugNear"
              style={{
                width: 184,
                height: 77,
                position: "absolute",
                top: -17,
                left: -2,
              }}
              resizeMode="contain"
            />
          </View>
          <Text style={[s.label, { flexShrink: 1, textAlign: "right" }]}>
            {market === "IN"
              ? "MADE FOR INDIA"
              : market === "AE"
                ? "DUBAI · PARTNERSHIPS"
                : "CHOOSE REGION"}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "#eef1ff",
            paddingVertical: 9,
            paddingHorizontal: 22,
          }}
        >
          <Text style={{ fontSize: 10, color: "#2449eb", textAlign: "center" }}>
            {market === "IN"
              ? "Pilot · Direct UPI receipt is confirmed by hosts, not by a bank integration."
              : "Dubai · Partnership enquiries only. Booking and payment are not available."}
          </Text>
        </View>
        {market === "IN" && <PwaStatus />}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.body}
        >
          {!!authError && (
            <Text accessibilityRole="alert" style={s.error}>
              {authError}
            </Text>
          )}
          {!ready ? (
            <ActivityIndicator color={palette.green} />
          ) : market !== "IN" ? (
            <MarketEntry market={market} />
          ) : !configured ? (
            <Card>
              <Text style={s.h2}>Connect PlugNear</Text>
              <Text style={s.text}>
                Configure this app with the dedicated PlugNear publishable key.
                No sample chargers or bookings are shown.
              </Text>
            </Card>
          ) : !session ? (
            <Auth />
          ) : recovering ? (
            <PasswordRecovery onDone={() => setRecovering(false)} />
          ) : tab === "Find a charger" ? (
            <Discover onHost={() => setTab("List a charger")} />
          ) : tab === "List a charger" ? (
            <Host uid={session.user.id} />
          ) : tab === "Bookings" ? (
            <Bookings uid={session.user.id} />
          ) : (
            <Account uid={session.user.id} />
          )}{" "}
        </ScrollView>
        {session && !recovering && (
          <View
            style={{
              flexDirection: "row",
              borderTopWidth: 1,
              borderColor: palette.line,
              backgroundColor: "#fff",
              paddingVertical: 8,
            }}
          >
            {tabs.map((t, i) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                key={t}
                onPress={() => setTab(t)}
                style={{ flex: 1, padding: 10, alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    color: tab === t ? palette.green : palette.muted,
                  }}
                >
                  {["⌖", "ϟ", "▤", "◎"][i]}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: tab === t ? "800" : "500",
                    color: palette.ink,
                  }}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
