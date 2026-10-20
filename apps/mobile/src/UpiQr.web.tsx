import { useEffect, useState } from "react";
import { Image, Text } from "react-native";
import QRCode from "qrcode";
import { s } from "./ui";
export function UpiQr({ uri }: { uri: string }) {
  const [data, setData] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData("");
    setError("");
    void QRCode.toDataURL(uri, {
      width: 256,
      margin: 3,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setData(url);
      })
      .catch(() => {
        if (active)
          setError("Could not render QR. Use the UPI app link instead.");
      });
    return () => {
      active = false;
    };
  }, [uri]);
  return data ? (
    <Image
      source={{ uri: data }}
      accessibilityLabel="Scan this UPI payment QR and check the recipient and amount in your UPI app"
      style={{ width: 256, height: 256, maxWidth: "100%", alignSelf: "center" }}
    />
  ) : (
    <Text style={s.text}>{error || "Preparing QR…"}</Text>
  );
}
