import { SupportLinks } from "./SupportLinks";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { db, publicAuthSettings } from "./client";
import { authRedirect, socialSignIn } from "./oauth";
import { normalizePhone } from "./auth-input";
import { Button, Card, Field, s } from "./ui";
export function Auth() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [phone, setPhone] = useState(""),
    [otp, setOtp] = useState(""),
    [sentTo, setSentTo] = useState(""),
    [retryAt, setRetryAt] = useState(0),
    [now, setNow] = useState(Date.now()),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"signin" | "signup">("signin"),
    [method, setMethod] = useState<"email" | "phone">("email"),
    [providers, setProviders] = useState({
      google: false,
      apple: false,
      phone: false,
    }),
    [settingsReady, setSettingsReady] = useState(false);
  useEffect(() => {
    let active = true;
    void publicAuthSettings()
      .then((value) => {
        if (active) {
          setProviders(value);
          setSettingsReady(true);
        }
      })
      .catch(() => {
        if (active)
          setMessage(
            "Could not check sign-in providers. Email is still available; reopen the app to retry.",
          );
      });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function emailSubmit() {
    const result =
      mode === "signin"
        ? await db!.auth.signInWithPassword({ email: email.trim(), password })
        : await db!.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: authRedirect() },
          });
    if (result.error) throw result.error;
    if (!result.data.session)
      setMessage(
        "Check your email to confirm your account, then sign in. Add your contact phone in Account after signing in.",
      );
  }
  async function sendCode() {
    const normalized = normalizePhone(phone);
    const { error } = await db!.auth.signInWithOtp({ phone: normalized });
    if (error) throw error;
    setSentTo(normalized);
    setOtp("");
    setRetryAt(Date.now() + 60000);
    setMessage(
      "If SMS delivery is available, a verification code has been sent. Enter it below.",
    );
  }
  async function verifyCode() {
    const { error } = await db!.auth.verifyOtp({
      phone: sentTo,
      token: otp.trim(),
      type: "sms",
    });
    if (error) throw error;
  }
  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return (
    <>
      <Text style={s.text}>EVERY EV. EVERY JOURNEY.</Text>
      <Text style={s.title}>{"Find. Request.\nPay your host. Charge."}</Text>
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
        {providers.google && (
          <Button
            quiet
            disabled={busy}
            onPress={() => void run(() => socialSignIn("google"))}
          >
            Continue with Google
          </Button>
        )}
        {Platform.OS === "ios" && providers.apple && (
          <Button
            quiet
            disabled={busy}
            onPress={() => void run(() => socialSignIn("apple"))}
          >
            Continue with Apple
          </Button>
        )}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <Button
            quiet
            disabled={busy}
            onPress={() => {
              setMethod("email");
              setMessage("");
            }}
          >
            Use email
          </Button>
          <Button
            quiet
            disabled={busy}
            onPress={() => {
              setMethod("phone");
              setMessage("");
            }}
          >
            Use phone number
          </Button>
        </View>
        {method === "email" ? (
          <>
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
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChangeText={setPassword}
            />
            <Button
              disabled={busy || !email.trim() || password.length < 8}
              onPress={() => void run(emailSubmit)}
            >
              {busy
                ? "Connecting…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
            <Button
              quiet
              disabled={busy}
              onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already registered? Sign in"}
            </Button>
            {mode === "signin" && (
              <Button
                quiet
                disabled={busy || !email.trim()}
                onPress={() =>
                  void run(async () => {
                    const { error } = await db!.auth.resetPasswordForEmail(
                      email.trim(),
                      { redirectTo: authRedirect() },
                    );
                    if (error) throw error;
                    setMessage(
                      "If an account exists for this email, a password reset link will be sent. Open it in the same app or browser where you requested it.",
                    );
                  })
                }
              >
                Forgot password?
              </Button>
            )}
            <Text style={s.text}>
              Use at least 8 characters. Confirm your email before booking. A
              contact phone can be saved in Account; it is not automatically
              verified.
            </Text>
          </>
        ) : (
          <>
            <Text style={s.h2}>Sign in or register by phone</Text>
            <Field
              label="Mobile number"
              keyboardType="phone-pad"
              autoComplete="tel"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setSentTo("");
                setOtp("");
              }}
            />
            <Text style={s.text}>
              Use 10 digits for an Indian mobile number, or include your country
              code, such as +91.
            </Text>
            {!providers.phone && (
              <Text style={s.text}>
                Phone OTP is awaiting SMS provider setup. Use email for now.
              </Text>
            )}
            <Button
              disabled={busy || !providers.phone || !phone.trim() || wait > 0}
              onPress={() => void run(sendCode)}
            >
              {wait > 0
                ? `Resend in ${wait}s`
                : sentTo
                  ? "Resend code"
                  : "Send verification code"}
            </Button>
            {!!sentTo && (
              <>
                <Text style={s.text}>Code sent to {sentTo}</Text>
                <Field
                  label="Verification code"
                  keyboardType="number-pad"
                  autoComplete="sms-otp"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={10}
                />
                <Button
                  disabled={busy || !/^\d{6,10}$/.test(otp.trim())}
                  onPress={() => void run(verifyCode)}
                >
                  Verify and continue
                </Button>
              </>
            )}
          </>
        )}
      </Card>
      {!!message && (
        <Text accessibilityRole="alert" style={s.text}>
          {message}
        </Text>
      )}
      <SupportLinks />
    </>
  );
}
