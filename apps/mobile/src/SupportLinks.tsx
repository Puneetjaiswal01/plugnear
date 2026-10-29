import { Linking, Text } from "react-native";
import { useState } from "react";
import { Button, s } from "./ui";
export function SupportLinks() {
  const [message, setMessage] = useState("");
  async function open(path: string) {
    try {
      await Linking.openURL(`https://www.plugnear.in/${path}/`);
    } catch {
      setMessage(
        "Could not open the page. Visit www.plugnear.in or email puneetjaiswal@zohomail.in.",
      );
    }
  }
  return (
    <>
      <Button quiet onPress={() => void open("dubai")}>
        Dubai partnerships
      </Button>
      <Button quiet onPress={() => void open("privacy")}>
        Privacy policy
      </Button>
      <Button quiet onPress={() => void open("support")}>
        Help and support
      </Button>
      <Button quiet onPress={() => void open("delete-account")}>
        Request account deletion
      </Button>
      <Text style={s.text}>
        Deletion requests are reviewed by the team. The page prepares an email;
        you must send it to submit the request.
      </Text>
      {!!message && <Text style={s.error}>{message}</Text>}
    </>
  );
}
