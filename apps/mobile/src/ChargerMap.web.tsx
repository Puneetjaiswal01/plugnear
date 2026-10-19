import { createElement } from "react";
import type { Charger } from "@plugnear/core/domain";
export default function ChargerMap({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
  chargers: Charger[];
  onSelect: (c: Charger) => void;
}) {
  return createElement("iframe", {
    title: "Nearby charging map",
    src: `https://maps.google.com/maps?q=${lat},${lon}&z=13&output=embed`,
    loading: "lazy",
    referrerPolicy: "no-referrer",
    style: { width: "100%", height: 280, border: 0, borderRadius: 20 },
  });
}
