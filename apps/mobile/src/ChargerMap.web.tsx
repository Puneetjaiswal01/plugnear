import { createElement, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Charger } from "@plugnear/core/domain";
export default function ChargerMap({
  lat,
  lon,
  chargers,
  onSelect,
}: {
  lat: number;
  lon: number;
  chargers: Charger[];
  onSelect: (c: Charger) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markers = useRef<L.LayerGroup | null>(null),
    select = useRef(onSelect);
  select.current = onSelect;
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, { scrollWheelZoom: false }).setView(
      [lat, lon],
      13,
    );
    map.current = m;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    L.circleMarker([lat, lon], { radius: 7, color: "#2449eb", fillOpacity: 1 })
      .addTo(m)
      .bindTooltip("Your search location");
    markers.current = L.layerGroup().addTo(m);
    return () => {
      m.remove();
      map.current = null;
      markers.current = null;
    };
  }, [lat, lon]);
  useEffect(() => {
    const group = markers.current;
    if (!group) return;
    group.clearLayers();
    chargers.forEach((c) => {
      const label = document.createElement("span");
      label.textContent = `${c.title} · ${c.availability_status || "Check availability"}`;
      L.circleMarker([c.latitude, c.longitude], {
        radius: 11,
        color:
          c.availability_status === "available"
            ? "#247344"
            : c.availability_status === "busy"
              ? "#b56d17"
              : "#6b7280",
        fillOpacity: 0.85,
        weight: 3,
      })
        .bindTooltip(label)
        .on("click", () => select.current(c))
        .addTo(group);
    });
  }, [chargers, lat, lon]);
  return createElement("div", {
    ref: container,
    role: "region",
    "aria-label":
      "Nearby charger map. Select a marker or choose a charger from the list below.",
    style: { height: 340, width: "100%", borderRadius: 16, zIndex: 0 },
  });
}
