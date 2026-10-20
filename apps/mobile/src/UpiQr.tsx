import { Text } from "react-native";
import { s } from "./ui";
export function UpiQr({ uri }: { uri: string }) {
  return (
    <Text style={s.text}>
      Use “Open UPI app” on your phone to open the payment request. The web app
      also displays a scannable QR.
    </Text>
  );
}
