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
import { db, configured } from "./src/client";
import { Button, Field, Card, s, palette } from "./src/ui";
import { Discover } from "./src/Discover";
import { Host } from "./src/Host";
import { Bookings } from "./src/Bookings";
import { Account } from "./src/Account";
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
function Auth() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"signin" | "signup">("signin");
  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const result =
        mode === "signin"
          ? await db!.auth.signInWithPassword({ email: email.trim(), password })
          : await db!.auth.signUp({
              email: email.trim(),
              password,
              options: {
                emailRedirectTo:
                  Platform.OS === "web"
                    ? window.location.origin
                    : "plugnear://auth/callback",
              },
            });
      if (result.error) throw result.error;
      if (!result.data.session)
        setMessage("Check your email to confirm your account, then sign in.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={s.text}>EVERY EV. EVERY JOURNEY.</Text>
      <Text style={s.title}>{"One PlugNear.\nFor the way you move."}</Text>
      <Text style={s.text}>
        Cars, taxis, bikes, scooters and fleets. Find a nearby charger or share
        yours — one connected charging community for India.
      </Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.h2}>Find / rent</Text>
            <Text style={s.text}>Your next charge, around the corner.</Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.h2}>List a charger</Text>
            <Text style={s.text}>Turn your charger into opportunity.</Text>
          </Card>
        </View>
      </View>
      <Card>
        <Text style={s.h2}>
          {mode === "signin" ? "Welcome back." : "Join the neighbourhood."}
        </Text>
        <Field
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChangeText={setPassword}
        />
        <Button
          disabled={busy || !email || password.length < 8}
          onPress={() => void submit()}
        >
          {busy
            ? "Connecting…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </Button>
        <Button
          quiet
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already registered? Sign in"}
        </Button>
        <Text style={s.text}>
          Use at least 8 characters. Confirm your email before booking.
        </Text>
      </Card>
      {!!message && (
        <Text accessibilityRole="alert" style={s.text}>
          {message}
        </Text>
      )}
    </>
  );
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false),
    [tab, setTab] = useState<(typeof tabs)[number]>(entryTab),
    [authError, setAuthError] = useState("");
  useEffect(() => {
    if (!db) {
      setReady(true);
      return;
    }
    const client = db;
    void client.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setSession(data.session);
      setReady(true);
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, value) => {
      setSession(value);
      setTab(entryTab());
    });
    async function handle(url: string) {
      try {
        if (!url.startsWith("plugnear://auth/callback")) return;
        const params = new URLSearchParams(url.split("#")[1] || "");
        if (params.get("error_description"))
          throw Error(params.get("error_description")!);
        const access_token = params.get("access_token"),
          refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await client.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
        }
      } catch (e) {
        setAuthError((e as Error).message);
      }
    }
    const link = Linking.addEventListener("url", (e) => void handle(e.url));
    void Linking.getInitialURL().then((url) => {
      if (url) void handle(url);
    });
    return () => {
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
          <Text style={s.label}>MADE FOR INDIA</Text>
        </View>
        <View
          style={{
            backgroundColor: "#eef1ff",
            paddingVertical: 9,
            paddingHorizontal: 22,
          }}
        >
          <Text style={{ fontSize: 10, color: "#2449eb", textAlign: "center" }}>
            Early access · Booking and online payments are being prepared.
          </Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.body}
        >
          {!ready ? (
            <ActivityIndicator color={palette.green} />
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
          ) : tab === "Find a charger" ? (
            <Discover />
          ) : tab === "List a charger" ? (
            <Host uid={session.user.id} />
          ) : tab === "Bookings" ? (
            <Bookings uid={session.user.id} />
          ) : (
            <Account uid={session.user.id} />
          )}{" "}
          {!!authError && <Text style={s.error}>{authError}</Text>}
        </ScrollView>
        {session && (
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
