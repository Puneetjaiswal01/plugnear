import type { ExpoConfig } from "expo/config";
export default (): ExpoConfig => ({
  name: "PlugNear",
  slug: "plugnear",
  version: "0.5.0",
  scheme: "plugnear",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "in.plugnear.mobile",
    supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: "in.plugnear.mobile",
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    config: {
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || "" },
    },
  },
  web: {
    bundler: "metro",
    name: "PlugNear",
    shortName: "PlugNear",
    description:
      "Find a charger. Share a charger. India’s neighbourhood EV charging network.",
  },
  plugins: [
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "PlugNear uses your location to find nearby chargers and register your charger’s exact position.",
      },
    ],
    "expo-secure-store",
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || "",
      },
    ],
  ],
});
