import { useEffect, useState } from "react";
import { Text } from "react-native";
import { db } from "./client";
import { Button, Field, Card, s } from "./ui";
export function Account({ uid }: { uid: string }) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
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
            setBusy(true);
            void db!
              .from("profiles")
              .update({ display_name: name, phone })
              .eq("id", uid)
              .select("id")
              .single()
              .then(({ error }) => {
                setMessage(error ? error.message : "Profile saved.");
                setBusy(false);
              });
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
    </>
  );
}
