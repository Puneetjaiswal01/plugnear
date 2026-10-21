import { useEffect, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { chargerColour, type ChargerMapProps } from "./map-types";
export default function ChargerMap({
  lat,
  lon,
  chargers,
  selectedId,
  showSearchLocation,
  showUserLocation,
  onSelect,
  onCenterChange,
  onMapError,
}: ChargerMapProps) {
  const map = useRef<MapView>(null);
  useEffect(() => {
    map.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      },
      250,
    );
  }, [lat, lon]);
  return (
    <MapView
      ref={map}
      style={{ height: 340, borderRadius: 16 }}
      showsUserLocation={showUserLocation}
      initialRegion={{
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
      onRegionChangeComplete={(region) =>
        onCenterChange({ lat: region.latitude, lon: region.longitude })
      }
      onMapReady={() => onMapError("")}
    >
      {showSearchLocation && (
        <Marker
          coordinate={{ latitude: lat, longitude: lon }}
          title="Search location"
          pinColor="#2449eb"
        />
      )}
      {chargers.map((charger) => (
        <Marker
          key={charger.id}
          coordinate={{
            latitude: charger.latitude,
            longitude: charger.longitude,
          }}
          title={charger.title}
          description={`${charger.availability_status || "Check availability"} · ₹${charger.price_per_kwh}/kWh · ${charger.connector}`}
          pinColor={chargerColour(charger.availability_status)}
          opacity={selectedId && selectedId !== charger.id ? 0.7 : 1}
          onPress={() => onSelect(charger)}
        />
      ))}
    </MapView>
  );
}
