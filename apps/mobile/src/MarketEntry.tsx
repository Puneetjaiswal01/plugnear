import { useState } from "react";
import { Text, Linking } from "react-native";
import { getMarket, type MarketCode } from "@plugnear/core/markets";
import { Button, Card, s } from "./ui";
export function MarketEntry({ market }: { market: MarketCode | null }) {
  const dubai = market === "AE";
  const [error, setError] = useState("");
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError(
        "Open www.plugnear.in in your browser and choose Dubai partnerships.",
      );
    }
  }

  return (
    <Card>
      <Text style={s.title}>
        {dubai
          ? "Dubai, let’s plan the next connection."
          : "Choose your region."}
      </Text>
      <Text style={s.text}>
        {dubai
          ? "Dubai is open for partnership enquiries only. We’re seeking property, fleet and licensed charging-operator partners. Booking, charger listing and payment are not available in Dubai."
          : "This region is not configured. Choose the India pilot or discuss a Dubai partnership."}
      </Text>
      {dubai && (
        <Text style={s.text}>
          Dubai planning: AED · {getMarket("AE").timeZone}. India’s INR/UPI
          checkout does not apply to a UAE session.
        </Text>
      )}
      <Button onPress={() => void open("https://www.plugnear.in/dubai/")}>
        Explore Dubai partnerships
      </Button>
      <Button
        quiet
        onPress={() => void open("https://app.plugnear.in/app/?market=IN")}
      >
        Open the India pilot
      </Button>
      {error && <Text style={s.error}>{error}</Text>}
    </Card>
  );
}
