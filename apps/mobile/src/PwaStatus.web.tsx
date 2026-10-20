import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button, s } from "./ui";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine),
    [prompt, setPrompt] = useState<InstallPrompt | null>(null),
    [installed, setInstalled] = useState(
      window.matchMedia("(display-mode: standalone)").matches,
    ),
    [hint, setHint] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const install = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return (
    <View style={{ paddingHorizontal: 22, gap: 6 }}>
      {!online && (
        <Text accessibilityRole="alert" style={s.error}>
          Offline · live availability, requests and payment confirmation are
          unavailable. No actions will be queued.
        </Text>
      )}
      {!installed && (
        <Button
          quiet
          onPress={() => {
            if (prompt) {
              void prompt
                .prompt()
                .then(() => prompt.userChoice)
                .then(() => setPrompt(null))
                .catch(() => setHint(true));
            } else setHint(!hint);
          }}
        >
          Install PlugNear on your home screen
        </Button>
      )}
      {hint && (
        <Text style={s.text}>
          On iPhone: Safari → Share → Add to Home Screen. On Android: browser
          menu → Install app or Add to Home screen. Use a normal browser tab if
          your in-app browser does not offer installation.
        </Text>
      )}
    </View>
  );
}
