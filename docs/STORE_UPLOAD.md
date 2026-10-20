> **Web-first Android option:** Bubblewrap TWA source is now prepared; see [TWA_ANDROID.md](TWA_ANDROID.md). It wraps the deployed PWA and uses the same intended Android package. No AAB exists yet; SDK, signing and Digital Asset Links remain required. The Expo instructions below are the alternative native path.

# Upload PlugNear to Google Play and the App Store

The code is not yet store-ready. EAS build attempts are blocked by missing Expo authentication; no APK/AAB/IPA exists. Complete the functionality, account deletion, password recovery, privacy/support pages, live authorization and payment tests listed in MOBILE_BUILDS.md before submitting a production release. Uploading a binary does not make an app publicly available: testing, metadata and store review are separate steps.

## Shared setup

1. Create/sign in to the Expo account that will own a dedicated `plugnear` project. On your computer, install Node 24, extract the source archive and run `npm ci` at its root.
2. From `apps/mobile`, run `npx eas-cli@25.2.0 login`, then `npx eas-cli@25.2.0 init`. Because the config is dynamic, set the resulting **PlugNear** project UUID as `EXPO_PUBLIC_EAS_PROJECT_ID` in the local build environment and both EAS environments. Follow AUTHENTICATION_SETUP.md for the backend and login provider setup.
3. Configure the public Supabase URL/key and restricted Android Maps key in EAS environments. Never use a service-role key in an app. Confirm ownership/availability of `in.plugnear.mobile` on both stores before the first upload; a published package identifier cannot simply be renamed later.
4. Review release icons, screenshots, privacy policy URL, terms/support, age rating, and actual data collection. Configure signing through EAS using only PlugNear-owned credentials. Never paste tokens, store passwords, keystores or Apple keys into chat.

## Google Play

1. Open [Google Play Console](https://play.google.com/console/) and enrol/verify the developer account. Create a new app named PlugNear, choose its language, category and distribution settings. Any developer enrolment fees are paid directly to Google.
2. Run `npm run build:android:preview` for an internal APK to test on Android. Then run `npm run build:android` for the production **AAB**. Download the finished AAB from the dedicated EAS project's build page. APKs are useful for direct device testing; use the production app bundle for Play submission.
3. In Play Console, set up Play App Signing, then go to Testing → Internal testing → Create release. Upload the AAB, add release notes and testers, resolve validation errors, review and roll out the internal release. Keep the upload key under controlled ownership and use the Play signing certificate when restricting the production Maps key.
4. Complete Store listing, screenshots, contact/support, privacy policy, App access instructions with a review account where needed, ads/content rating, target audience and Data Safety. Provide working account deletion in the app and the required web request URL. Disclose location, account information and any payment data accurately.
5. Check the Console's production eligibility requirements. New personal developer accounts may require a closed test with at least 12 opted-in testers for 14 continuous days before requesting production access; the Console's requirements for your account are authoritative. Internal testing alone does not satisfy this requirement.
6. After eligibility and end-to-end checks pass, create the production release and submit it for review. Do not assume an upload is approved or publicly live.

For the first Play upload, use the Console manually. Later automated submissions can use an authorised Google Play service account and EAS Submit; configure credentials securely rather than committing its JSON key.

## Apple App Store

1. Enrol/verify an [Apple Developer](https://developer.apple.com/programs/) account and accept agreements. Register the PlugNear app identifier and create its app record in [App Store Connect](https://appstoreconnect.apple.com/) using the exact bundle ID. Enrolment fees are paid directly to Apple.
2. Test using `npm run build:ios:simulator` on a Mac simulator; this output cannot be installed on an iPhone or uploaded to the store. For physical-device testing, use the iOS preview profile with valid Apple signing and registered devices, or use TestFlight after a signed production build.
3. Run `npm run build:ios`. Configure the Apple team, distribution certificate and provisioning through EAS when prompted. Download the signed IPA after the build succeeds. This cloud build can be requested from Windows/Linux, but iOS simulator execution needs macOS.
4. Upload the selected build with `npx eas-cli@25.2.0 submit --platform ios` and choose the exact PlugNear build interactively, or use Apple's Transporter on macOS. EAS will require App Store Connect authorisation; provide it securely through the supported signing/submission flow. No store IDs or credentials are prefilled in this repository.
5. Wait for Apple processing, resolve compliance questions, then distribute to internal TestFlight testers. External TestFlight testing may need beta review.
6. Complete the app version's listing, required screenshots for supported iPhone/iPad sizes, privacy policy/support URLs, age rating, App Privacy disclosures and review notes/account. Implement in-app account deletion and ensure offered login services comply with Apple's rules. Resolve outstanding paid-app/business agreements where applicable.
7. Select the processed build, submit for App Review and choose manual/automatic release. TestFlight availability is not an App Store launch.

## Actual status

No store accounts were enrolled, fees incurred, keys created, binaries uploaded or submissions made during this session. Account access and credentials are still needed. A successful Expo native export/prebuild is not a signed build or store approval.

References: [Google release instructions](https://support.google.com/googleplay/android-developer/answer/9859152), [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465), [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [EAS Submit](https://docs.expo.dev/submit/introduction/).
