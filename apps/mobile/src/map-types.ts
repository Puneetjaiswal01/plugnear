import type { Charger } from "@plugnear/core/domain";
export type MapPoint = { lat: number; lon: number };
export type ChargerMapProps = MapPoint & {
  chargers: Charger[];
  selectedId?: string;
  showSearchLocation: boolean;
  showUserLocation: boolean;
  onSelect: (charger: Charger) => void;
  onCenterChange: (point: MapPoint) => void;
  onMapError: (message: string) => void;
};
export function chargerColour(status: Charger["availability_status"]): string {
  return status === "available"
    ? "#247344"
    : status === "busy"
      ? "#a25d0c"
      : "#6b7280";
}
