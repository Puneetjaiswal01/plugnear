import { useState } from "react";
import { Text } from "react-native";
import { db } from "./client";
import { Button, Card, Field, s } from "./ui";
export function PasswordRecovery({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      if (password.length < 8 || password !== confirm)
        throw new Error(
          "Use at least 8 characters and enter the same password twice.",
        );
      const { error } = await db!.auth.updateUser({ password });
      if (error) throw error;
      // End this recovery session; require login with the replacement password.
      const { error: signOutError } = await db!.auth.signOut();
      if (signOutError)
        throw new Error(
          "Password updated. Sign out and sign in again before continuing.",
        );
      onDone();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <Text style={s.h2}>Choose a new password</Text>
      <Text style={s.text}>
        Use a unique password with at least 8 characters.
      </Text>
      <Field
        label="New password"
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Field
        label="Confirm new password"
        autoCapitalize="none"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <Button
        disabled={busy || password.length < 8 || password !== confirm}
        onPress={() => void save()}
      >
        {busy ? "Updating…" : "Update password"}
      </Button>
      <Button
        quiet
        disabled={busy}
        onPress={() => {
          void db!.auth.signOut().then(({ error }) => {
            if (error) setMessage(error.message);
            else onDone();
          });
        }}
      >
        Cancel and sign out
      </Button>
      {!!message && (
        <Text accessibilityRole="alert" style={s.error}>
          {message}
        </Text>
      )}
    </Card>
  );
}
