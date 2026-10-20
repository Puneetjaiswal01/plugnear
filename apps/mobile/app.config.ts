import type { ExpoConfig } from "expo/config";
export default (): ExpoConfig => {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    "79c1f64d-8d2d-402c-ac4f-21359de9054b";
  if (
    projectId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      projectId,
    )
  ) {
    throw new Error(
      "EXPO_PUBLIC_EAS_PROJECT_ID must be the dedicated PlugNear EAS project UUID.",
    );
  }
  if (
    process.env.EAS_BUILD_PROFILE === "production" &&
    process.env.EAS_BUILD_PLATFORM === "android" &&
    !process.env.GOOGLE_MAPS_ANDROID_API_KEY
  ) {
    throw new Error(
      "Production Android builds require a package/signing-certificate restricted Google Maps key.",
    );
  }
  return {
    name: "PlugNear",
    slug: "plugnear",
    version: "0.5.0",
    scheme: "plugnear",
    icon: "./assets/icon.png",
    ...(projectId ? { extra: { eas: { projectId } } } : {}),
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "in.plugnear.mobile",
      supportsTablet: true,
      buildNumber: "1",
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      package: "in.plugnear.mobile",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#FAFAF5",
      },
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
      ],
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
          androidGoogleMapsApiKey:
            process.env.GOOGLE_MAPS_ANDROID_API_KEY || "",
        },
      ],
    ],
  };
};
