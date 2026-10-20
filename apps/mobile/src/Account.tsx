import { SupportLinks } from "./SupportLinks";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { db } from "./client";
import { Button, Field, Card, s } from "./ui";
import { normalizePhone } from "./auth-input";
export function Account({ uid }: { uid: string }) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [identity, setIdentity] = useState({
      email: "",
      phone: "",
      emailVerified: false,
      phoneVerified: false,
    });
  useEffect(() => {
    void db!.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else if (data.user)
          setIdentity({
            email: data.user.email || "",
            phone: data.user.phone || "",
            emailVerified: !!data.user.email_confirmed_at,
            phoneVerified: !!data.user.phone_confirmed_at,
          });
      })
      .catch(() =>
        setMessage("Could not load account identity. Please retry."),
      );
    void db!
      .from("profiles")
      .select("display_name,phone")
      .eq("id", uid)
      .single()
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else {
          setName(data.display_name || "");
          setPhone(data.phone || "");
        }
      });
  }, [uid]);
  return (
    <>
      <Text style={s.title}>Good to know you.</Text>
      <Card>
        <Text style={s.h2}>Your login details</Text>
        <Text style={s.text}>
          Email: {identity.email || "Not linked"}
          {identity.emailVerified ? " · verified" : ""}
        </Text>
        <Text style={s.text}>
          Login phone: {identity.phone || "Not linked"}
          {identity.phoneVerified ? " · verified" : ""}
        </Text>
        <Text style={s.text}>
          The contact number below is separate from your verified login
          identity. Saving it does not verify or change your sign-in number.
        </Text>
        <Field label="Display name" value={name} onChangeText={setName} />
        <Field
          label="Phone (+91…)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button
          disabled={busy}
          onPress={() => {
            void (async () => {
              setBusy(true);
              try {
                const normalized = phone.trim() ? normalizePhone(phone) : "";
                const { error } = await db!
                  .from("profiles")
                  .update({ display_name: name.trim(), phone: normalized })
                  .eq("id", uid)
                  .select("id")
                  .single();
                if (error) throw error;
                setPhone(normalized);
                setMessage("Profile saved. Contact phone is not OTP-verified.");
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          Save profile
        </Button>
        <Button quiet onPress={() => void db!.auth.signOut()}>
          Sign out
        </Button>
        <Text style={s.text}>
          Your phone number is private. Hosting verification is reviewed
          separately.
        </Text>
      </Card>
      {!!message && <Text style={s.text}>{message}</Text>}
      <SupportLinks />
    </>
  );
}
