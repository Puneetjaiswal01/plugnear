import MapView, { Marker } from "react-native-maps";
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
  return (
    <MapView
      key={`${lat}:${lon}`}
      style={{ height: 280, borderRadius: 20 }}
      showsUserLocation
      initialRegion={{
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
    >
      {chargers.map((c) => (
        <Marker
          key={c.id}
          coordinate={{ latitude: c.latitude, longitude: c.longitude }}
          title={c.title}
          description={`₹${c.price_per_kwh}/kWh · ${c.connector}`}
          onPress={() => onSelect(c)}
        />
      ))}
    </MapView>
  );
}
