import { createElement, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { chargerColour, type ChargerMapProps } from "./map-types";
export default function ChargerMap(props: ChargerMapProps) {
  const { lat, lon, chargers, selectedId, showSearchLocation } = props;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const origin = useRef<L.CircleMarker | null>(null);
  const callbacks = useRef(props);
  callbacks.current = props;
  useEffect(() => {
    if (!container.current) return;
    const initial = callbacks.current;
    const m = L.map(container.current, { scrollWheelZoom: false }).setView(
      [initial.lat, initial.lon],
      12,
    );
    map.current = m;
    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    tiles.on("tileerror", () =>
      callbacks.current.onMapError(
        "Map tiles could not load. You can still choose a charger from the list or retry when your connection improves.",
      ),
    );
    tiles.on("tileload", () => callbacks.current.onMapError(""));
    tiles.addTo(m);
    markers.current = L.layerGroup().addTo(m);
    m.on("moveend", () => {
      const center = m.getCenter().wrap();
      callbacks.current.onCenterChange({ lat: center.lat, lon: center.lng });
    });
    const resize = new ResizeObserver(() => m.invalidateSize({ pan: false }));
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
      markers.current = null;
      origin.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.setView([lat, lon], m.getZoom(), { animate: false });
    callbacks.current.onCenterChange({ lat, lon });
    if (origin.current) {
      m.removeLayer(origin.current);
      origin.current = null;
    }
    if (showSearchLocation)
      origin.current = L.circleMarker([lat, lon], {
        radius: 7,
        color: "#2449eb",
        fillOpacity: 1,
      })
        .addTo(m)
        .bindTooltip("Search location");
  }, [lat, lon, showSearchLocation]);
  useEffect(() => {
    const group = markers.current;
    if (!group) return;
    group.clearLayers();
    chargers.forEach((charger) => {
      const description = `${charger.title} · ${charger.availability_status || "Check availability"}`;
      const label = document.createElement("span");
      label.textContent = description;
      const selected = charger.id === selectedId;
      const marker = L.circleMarker([charger.latitude, charger.longitude], {
        radius: selected ? 14 : 11,
        color: chargerColour(charger.availability_status),
        fillOpacity: 0.85,
        weight: selected ? 5 : 3,
      })
        .bindTooltip(label)
        .on("click", () => callbacks.current.onSelect(charger))
        .addTo(group);
      const element = marker.getElement();
      if (element) {
        element.setAttribute("tabindex", "0");
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", `View ${description}`);
        element.setAttribute("aria-pressed", String(selected));
        element.addEventListener("keydown", (event) => {
          if (!(event instanceof KeyboardEvent)) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            callbacks.current.onSelect(charger);
          }
        });
      }
    });
  }, [chargers, selectedId]);
  return createElement("div", {
    ref: container,
    role: "region",
    "aria-label":
      "Nearby charger map. Move the map and search this area, or select a charger marker.",
    style: { height: 340, width: "100%", borderRadius: 16, zIndex: 0 },
  });
}
