# First Google Play internal release

## Current blocker
Expo CLI reports no signed-in user. No dedicated EAS project/signing identity is available to this workspace, and no AAB exists. Google Play account access is not connected. No upload or publication has occurred.

## Owner actions
1. Sign in or enrol at https://play.google.com/console/. Complete identity/device/organisation verification requested for your account. Pay any enrolment fee directly to Google.
2. Create the PlugNear app record. Review app type, pricing and developer details before confirming them. Keep it separate from all Claim360 apps.
3. Sign in or register at https://expo.dev/signup. Configure an authorised Expo session/token securely for this build environment; never paste passwords or tokens into chat.
4. Link a dedicated PlugNear EAS project, set its UUID and configure public backend/Maps variables as described in docs/MOBILE_BUILDS.md. Confirm ownership/availability of `in.plugnear.mobile` before first upload.
5. Build and test the preview APK, then build the signed production AAB. Store build output is required; the native-bundles ZIP is not uploadable to Play.
6. In Play Console: Testing → Internal testing → Create release → upload AAB → release notes → review. Add the intended testers and distribute the opt-in URL after release processing. Do not select production rollout for this early-access build.

## Before any public release
- Complete live backend/authentication, permission and booking tests; expose only features that work in the submitted build.
- Implement password recovery, in-app account deletion and the web deletion route.
- Complete accurate App access, Data Safety, privacy policy, content rating, target audience, ads and support declarations. Do not guess answers.
- Verify Maps with the Play signing certificate, not only the EAS upload/preview certificate.
- Capture actual phone/tablet screenshots and required feature graphic; meet Console asset rules.
- Satisfy any closed-testing and production-access requirements displayed for your account. Internal testing is not a substitute.
- Confirm release version/code, signing ownership and current target-API requirements in the uploaded AAB.

No Play credentials or personal account details belong in this folder. Listing and release notes are drafts, not submissions. See docs/STORE_UPLOAD.md for the detailed guide and official references.
