# Actual results · 2026-10-19

| Check                           | Result                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Source audit                    | No v0.4 files found; user authorized new codebase                                                              |
| Dedicated Supabase              | PlugNear / yxisoddhwlzetrnfbbno / ap-south-1 / healthy                                                         |
| Claim360 changes                | None                                                                                                           |
| TypeScript                      | Mobile and admin pass                                                                                          |
| Domain + PostgreSQL tests       | 32 pass locally, including fleet-planning model validation                                                     |
| Desktop/mobile browser tests    | 32 pass: app/admin access plus website assets, navigation, FAQs, privacy and app-route checks                  |
| Admin production build          | Pass; Vite dist generated                                                                                      |
| Marketplace web export          | Pass; Metro bundle generated                                                                                   |
| Android and iOS exports         | Pass; Hermes bundles generated, no AAB/IPA                                                                     |
| Live migration                  | Not applied; two MCP write attempts returned expired request state; remote history rechecked                   |
| Dependency audit                | 35 high, 7 moderate unresolved Expo toolchain findings                                                         |
| GitHub repository               | Local checkout exists; remote create denied by integration permission, subsequent lookup 404                   |
| Vercel project/deployment       | Public website READY at https://www.plugnear.in; HTTPS and deployed browser checks pass; admin remains preview |
| Payments / UPI                  | Not provisioned or implemented; checkout unavailable                                                           |
| EAS / stores                    | Android/iOS native exports + prebuild passed; EAS builds attempted, blocked by Expo authentication; no APK/AAB/IPA                                              |
| Live booking/payment end-to-end | Not performed; pending schema and payment setup                                                                |

Latest Android/iOS Hermes exports and isolated native prebuild passed. Branded launcher icon, website-aligned blue/lime theme, dedicated-project configuration and preview/simulator/production profiles are prepared. Both cloud build attempts stopped before queueing because Expo is not authenticated. Signed builds and physical-device checks remain outstanding. See [mobile build results](MOBILE_BUILDS.md).

The codebase, migration, tests and generated bundles can be reviewed locally. Pre-launch deployment URLs and remaining DNS records are recorded in [infrastructure results](INFRASTRUCTURE.md). See [release procedure](RELEASE.md), [security findings](SECURITY.md), and [next stages](ROADMAP.md).

Latest public website deployment: see [website release](WEBSITE_RELEASE.md). Booking/payment launch remains pending.

Registration update: email/password plus provider-aware Google/Apple OAuth (PKCE) and phone OTP flows implemented. Live public Auth settings were checked: email enabled; Google, Apple and phone disabled. No provider secrets were available and no live provider was enabled. The 32 browser tests include mocked OTP, OAuth and email confirmation requests, not external provider end-to-end verification. See [authentication setup](AUTHENTICATION_SETUP.md) and [store uploads](STORE_UPLOAD.md).
