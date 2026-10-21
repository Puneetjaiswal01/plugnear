# Maps integration · 21 October 2026

## Driver experience

After signing in, open **Find**. The web/PWA now shows a real interactive Leaflet/OpenStreetMap map immediately, initially centred on Delhi NCR (explicitly not the user's GPS position). Move the map and select **Search this map area**, or select **Find chargers near me** and grant foreground location permission. Denied/slow GPS does not prevent manual area search. GPS acquisition has a 15-second timeout after permission is handled; no background location is requested.

Searches use the existing guarded Supabase `get_nearby_chargers` RPC. Connector, radius, price and power filters apply to that query. Only backend-approved listings are rendered; no example station is seeded. Green indicates available, amber busy and grey offline. The blue point identifies the search origin, which may be manually selected and must not be mistaken for real-time GPS. Charger markers can be selected with a pointer or keyboard; selecting one opens its existing availability/request workflow. Google Maps directions use the actual listing coordinates. Tile-loading errors show a message and preserve the accessible charger list.

The web map resizes with its container and recentres when a new search origin is selected. Tile requests retain OpenStreetMap attribution. No map tiles are precached or downloaded for offline use; the PWA's existing reconnect screen remains the offline behaviour. The privacy policy now explains manual map-centre searches alongside GPS searches. No new geocoder, address search API, commercial Maps credentials or anonymous database access was introduced.

## Native implementation

Expo Android/iOS use the existing `react-native-maps` integration with matching status colours, search-centre selection and markers. The user-location overlay is enabled only after foreground permission is granted. Android native production builds still require the existing package/signing-restricted `GOOGLE_MAPS_ANDROID_API_KEY`; iOS uses its default platform provider. TWA Android uses the web map instead of the Expo native provider. Native source typechecking and Android/iOS Metro exports do not prove device rendering, Google billing/key readiness or signed compilation.

## Verification and limits

Map browser tests use mocked authentication/charger responses and intentionally failed tile requests to exercise denial/failure paths, manual area search, GPS coordinates, keyboard marker selection, RPC filters and navigation coordinates. These fixtures are not live charger inventory and are not inserted into the database. Real physical-device GPS, native maps, navigation handoff and charging remain pilot acceptance tests. Database/auth redirect settings and SMS-provider setup are unchanged by this release.
