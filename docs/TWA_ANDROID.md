# PlugNear Android TWA wrapper

## Scope and identity

The Android project under `android/twa` wraps **https://app.plugnear.in/app/**, using Bubblewrap 1.27.0 / Android Browser Helper 2.7.4. It is an alternative Android delivery path to the existing Expo Android build; it is not a second marketplace or a second Play listing. Package ID stays `in.plugnear.mobile`. Check that ID against the owner's Play Console before the first upload. If native Expo Android later replaces the wrapper, preserve the Play app identity/signing lineage and use a larger version code.

Generated configuration uses target/compile API 36, minimum API 23, custom-tabs fallback, approved PlugNear icon, foreground location delegation and no notification delegation. It trusts only the app hostname. External support/OAuth/navigation origins can show browser UI; they must not be indiscriminately trusted. No background-location feature, advertising SDK, Play Billing or auto-payment confirmation is introduced. A TWA relies on a compatible installed browser; it is not a native charging-control application.

## Reproduce the project

From the repository root (Node 24):

```sh
npm ci
npm run build:website
npm ci --prefix tools/twa
npm run generate:twa
```

The generator uses the same local, approved icon and web manifest as the static website build, invokes pinned Bubblewrap Core and replaces its retired JCenter repositories with Maven Central. It does not fetch arbitrary remote configuration or generate a signing key. Generated Java/resources/Gradle wrapper are committed for review. `tools/twa/package-lock.json` separately pins the wrapper toolchain. `twa-manifest.json` is the source of truth; regenerate after editing it.

## Build and signing

Install Android Studio/SDK Manager, review the SDK licences, and install platform 36, compatible build tools and platform tools. Set `ANDROID_HOME` to that SDK and use a compatible JDK (Java 21 is available in this workspace).

```sh
npm run android:bundle:unsigned
```

This runs Gradle `:app:bundleRelease` and produces `android/twa/app/build/outputs/bundle/release/app-release.aab` **only if compilation succeeds**. The unsigned bundle cannot be submitted to Play.

For the signed release, configure Bubblewrap's local SDK/JDK settings on the build machine, then use the installed CLI:

```sh
cd android/twa
../../tools/twa/node_modules/.bin/bubblewrap build
```

The manifest's `signingKey` entry is a path/alias reference only; no keystore exists in the repository. Use the owner's dedicated PlugNear upload key, keep it backed up, and provide passwords interactively or through protected `BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` environment variables. Do not paste secrets into chat, commit them, or pass passwords in command arguments. The official CLI's build/update flow can regenerate files; preserve/reapply the documented repository hardening or rerun `npm run generate:twa` as appropriate. Review the final generated diff before signing. Do not bypass PWA validation to call a release ready.

## Required Digital Asset Links

1. In Play Console → App integrity / App signing, obtain the **app-signing certificate SHA-256** fingerprint. The Play-installed app uses that certificate, which can differ from the upload key. For locally installed signed APK testing, also add that APK's certificate if needed. Never publish a random, example or unrelated certificate.
2. Add each public fingerprint to `android/twa/twa-manifest.json` as `fingerprints: [{"name":"Play app signing","value":"EXACT_COLON_SEPARATED_SHA256"}]`, or configure `PLUGNEAR_ANDROID_SHA256_FINGERPRINTS` as a comma-separated website build value.
3. Rebuild/deploy the website. The build generates `/.well-known/assetlinks.json` for `in.plugnear.mobile`, validates fingerprints and fails on malformed values. It is served as JSON without redirects. No configured fingerprint produces `[]`: this intentionally trusts no certificate and is **not a completed TWA association**.
4. Verify https://app.plugnear.in/.well-known/assetlinks.json against the actual installed certificate. Test a Play internal-test installation and confirm fullscreen TWA launches. Merely serving valid JSON or creating an AAB does not establish the certificate relationship. An invalid/missing association falls back to browser UI.

## Physical-device acceptance

Check supported Chrome/custom-tabs behaviour, install/launch/back navigation, offline reconnect screen, GPS allow/deny and approximate location, email confirmation/recovery returning to the right browser/session, request/host acceptance, UPI-app handoff and return without duplicate payment, host manual receipt and start/finish. Chrome's origin permissions and Android's delegated location permission both need correct handling. Do not enable broad additional origins or automatic phone confirmation to work around a failed test.

Before Play production: owner-controlled signing and developer-account verification, store screenshots/listing, Data Safety and foreground-location disclosures, account deletion/support, reviewer access and a real verified host/charger/payment pilot remain required. Review current Console target-API and testing requirements at upload time. TWA does not waive Play review or personal-account testing rules. See STORE_UPLOAD.md for Play Console steps.

## Actual build status

Android source generation succeeded. This workspace has Java 21 but no Android SDK platform 36; the guarded bundle command stopped with an explicit SDK requirement. A raw Gradle bootstrap attempt also could not download through its default Java networking configuration. **No compiled APK/AAB, signing key or Play submission was created.** SDK installation/licence review, owner signing and the real certificate association remain pending. No dummy certificate was deployed.

## Backend verification for this sprint

Read-only live checks confirmed PostGIS 3.3.7, `chargers_location_gist`, authenticated-only `get_nearby_chargers` with `SECURITY INVOKER`, Realtime publication of chargers/bookings and RLS on every public table. The existing RPC arguments are `p_lat`, `p_lon`, `p_radius_km` (plus optional connector/price/power/limit); use those actual PostgREST parameter names rather than introducing a second ambiguous overload. Radius is validated to 1–100 km and the spatial predicate uses `ST_DWithin` in metres. Direct booking INSERT remains revoked; drivers reserve through the guarded pricing/idempotency/overlap RPC. Verified-owner restrictive policies remain in place.

The committed `supabase/tests/live_mvp_smoke.sql` ran successfully against PlugNear: nearby available state, busy propagation, reservation, server-priced checkout, driver report, rejected driver receipt confirmation, host receipt and charge start/finish. Its fixtures rolled back, and no transfer was sent. No schema changes were needed. Phone Auth remains disabled in live public settings because no SMS provider is provisioned; email remains enabled. Never auto-confirm a phone number to simulate production OTP.
