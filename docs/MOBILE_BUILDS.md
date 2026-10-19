# Android and iPhone build results

## Current verification

The PlugNear Expo app uses bundle/package ID `in.plugnear.mobile`, foreground location, native maps, dedicated Supabase client configuration, Find/List journeys, profiles and booking UI. The blue/lime brand and welcome copy now match the website. The app icon is a generated adaptation of the approved smiling plug mark; template artwork is no longer used for the launcher.

- Android and iOS Metro/Hermes exports: passed, under `apps/mobile/dist-native`. These bundles are not installable apps.
- TypeScript checks: passed. Domain/database/planner tests: 30 passed.
- Expo native generation: Android and iOS prebuild passed in an isolated temporary copy; no native project directories were added to the source checkout. This checks config plugins, manifest/plist generation and icon generation, not Gradle/Xcode compilation.
- EAS Android preview APK build: attempted; stopped before queueing with “An Expo user account is required to proceed.”
- EAS iOS simulator build: attempted; stopped with the same authentication error.
- No APK, AAB, IPA, TestFlight upload or store submission exists from this session. No physical-device validation was performed.

## Unblocking builds

1. Sign in to the intended Expo account using EAS CLI 25.2.0. Create/link a **dedicated PlugNear** project. Set `EXPO_PUBLIC_EAS_PROJECT_ID` to its UUID; do not reuse any Claim360 app/project or credentials. Because app.config.ts is dynamic, keep the UUID in EAS environment configuration and the local build environment rather than relying on an automatic config-file edit.
2. Provision the PlugNear Supabase URL and publishable key in the EAS `preview` and `production` environments. They are public client configuration, not service-role credentials. Environment files and signing files are excluded from upload with `.easignore`.
3. Configure `GOOGLE_MAPS_ANDROID_API_KEY`, restricted to this Android package and each relevant signing certificate. Production Android config fails if the key is missing. An empty preview key will not provide a working Google map.
4. From `apps/mobile`, run the checked-in build scripts:

   - `npm run build:android:preview`: internal Android APK.
   - `npm run build:ios:simulator`: simulator build; cannot install on a physical iPhone.
   - `npm run build:android`: production Play AAB with remote version increment.
   - `npm run build:ios`: signed production iOS build with remote version increment.

   Scripts pin the EAS CLI version. Preview iPhone builds use `eas build --platform ios --profile preview`; physical iPhones require Apple signing and registered devices for ad hoc distribution. Simulator builds do not require Apple distribution signing, but do require EAS authentication/cloud capacity.
5. Configure Android signing through the dedicated EAS project. For signed iOS distributions, configure the Apple Developer team, app identifier and provisioning in EAS. Store publishing also needs the appropriate Google Play/App Store Connect accounts and metadata. Never paste passwords, signing keys or access tokens into chat.

## Release gate

Public booking/payment launch remains blocked by the unapplied marketplace migration, payment-provider setup, live authorization/concurrency verification and real-device checks. Password recovery, account deletion and its web request route, actual privacy/support disclosures and store review requirements also remain outstanding. Do not submit the current early-access app as a completed marketplace. See STATUS.md and RELEASE.md.
