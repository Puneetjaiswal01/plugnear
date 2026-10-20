# Actual results · 2026-10-20

| Check                           | Result                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Source audit                    | No v0.4 files found; user authorized new codebase                                                              |
| Dedicated Supabase              | PlugNear / yxisoddhwlzetrnfbbno / ap-south-1 / healthy                                                         |
| Claim360 changes                | None                                                                                                           |
| TypeScript                      | Mobile and admin pass                                                                                          |
| Domain + PostgreSQL tests       | 41 pass locally, including fleet-planning model validation                                                     |
| Desktop/mobile browser tests    | 44 pass: app/admin access plus website assets, navigation, FAQs, privacy and app-route checks                  |
| Admin production build          | Pass; Vite dist generated                                                                                      |
| Marketplace web export          | Pass; Metro bundle generated                                                                                   |
| Android and iOS exports         | Pass; Hermes bundles generated, no AAB/IPA                                                                     |
| Live migration                  | Applied with explicit owner approval; live history, RLS, grants, constraints and rollback smoke verified                   |
| Dependency audit                | Fresh audit: 16 high, 7 moderate unresolved findings (23 total), mainly Expo/RN toolchain                                                         |
| GitHub repository               | Source pushed to public Puneetjaiswal01/plugnear after explicit owner approval; remote main verified                   |
| Vercel project/deployment       | Public website READY at https://www.plugnear.in; Public website and login-gated admin.plugnear.in READY; live browser checks pass |
| Payments / UPI                  | Not provisioned or implemented; checkout unavailable                                                           |
| EAS / stores                    | Android/iOS native exports + prebuild passed; EAS builds attempted, blocked by Expo authentication; no APK/AAB/IPA                                              |
| Live booking/payment end-to-end | Not performed; pending schema and payment setup                                                                |

Latest Android/iOS Hermes exports and isolated native prebuild passed. Branded launcher icon, website-aligned blue/lime theme, dedicated-project configuration and preview/simulator/production profiles are prepared. Both cloud build attempts stopped before queueing because Expo is not authenticated. Signed builds and physical-device checks remain outstanding. See [mobile build results](MOBILE_BUILDS.md).

The codebase, migration, tests and generated bundles can be reviewed locally. Pre-launch deployment URLs and remaining DNS records are recorded in [infrastructure results](INFRASTRUCTURE.md). See [release procedure](RELEASE.md), [security findings](SECURITY.md), and [next stages](ROADMAP.md).

Latest public website deployment: see [website release](WEBSITE_RELEASE.md). Booking/payment launch remains pending.

Registration update: email/password plus provider-aware Google/Apple OAuth (PKCE) and phone OTP flows implemented. Live public Auth settings were checked: email enabled; Google, Apple and phone disabled. No provider secrets were available and no live provider was enabled. The 32 browser tests include mocked OTP, OAuth and email confirmation requests, not external provider end-to-end verification. See [authentication setup](AUTHENTICATION_SETUP.md) and [store uploads](STORE_UPLOAD.md).

## Live database rollout · 20 October 2026

Marketplace migration applied as `20261020075219_marketplace_expansion`. RLS is enabled on all seven public tables. Anonymous reservation RPC execution, direct authenticated booking INSERT and client access-table SELECT are denied. A live rollback-only transaction passed reservation, retry idempotency, overlapping-request rejection and member admin denial; temporary fixtures were rolled back. This is SQL-level verification, not browser-to-Auth-to-payment end-to-end testing.

Security advisor: leaked-password protection remains disabled; the private access table has no policies intentionally and no client table grants. Performance advisor: two unindexed review/audit foreign keys and multiple own/admin SELECT policies remain, plus expected unused indexes before traffic. Password recovery and public privacy/terms/support/deletion-request pages are implemented. Deletion requests prepare an email for manual ownership review and processing; no automated deletion API or guaranteed completion SLA is claimed. Payment-provider approval, Google/Apple/SMS setup, verified first admin, Expo authentication, device signing and physical-device tests remain required. The owner has no incorporated company; individual/sole-proprietor merchant eligibility must be checked with the marketplace payment provider.

GitHub Actions CI passed on 20 October 2026 for `973849c41a1debee98b0bc5cc63bdfdd9031b8a3` (run 39390477645). Web and admin production deployments are READY. 38 browser checks and 32 unit/database checks passed. Current merchant onboarding brief is in release/merchant/INDIVIDUAL_ONBOARDING.md; no merchant account/KYC submission has been made.

## Web-first pilot scope

The new PostGIS/Realtime/manual-UPI migrations are applied. PWA installation/offline shell and selectable charger map are implemented; the latest build passed 41 unit/database tests and 44 browser tests. These use fixtures/rollback transactions, not real transfers. User confirms there is no SMS provider; phone OTP remains disabled. app.plugnear.in is attached but Hostinger DNS is missing. Live verified-host/charger inventory remains zero. See WEB_FIRST_MVP.md for exact delivery, manual payment semantics and remaining launch gates. Historical statements above about payment integration refer to gateways; this pilot deliberately uses direct-to-host UPI with manual receipt confirmation, not independently verified online payment processing.
