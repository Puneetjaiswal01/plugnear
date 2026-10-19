# Actual results · 2026-10-19

| Check                           | Result                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Source audit                    | No v0.4 files found; user authorized new codebase                                                              |
| Dedicated Supabase              | PlugNear / yxisoddhwlzetrnfbbno / ap-south-1 / healthy                                                         |
| Claim360 changes                | None                                                                                                           |
| TypeScript                      | Mobile and admin pass                                                                                          |
| Domain + PostgreSQL tests       | 28 pass locally, including fleet-planning model validation                                                     |
| Desktop/mobile browser tests    | 22 pass: app/admin access plus website assets, navigation, FAQs, privacy and app-route checks                  |
| Admin production build          | Pass; Vite dist generated                                                                                      |
| Marketplace web export          | Pass; Metro bundle generated                                                                                   |
| Android and iOS exports         | Pass; Hermes bundles generated, no AAB/IPA                                                                     |
| Live migration                  | Not applied; two MCP write attempts returned expired request state; remote history rechecked                   |
| Dependency audit                | 35 high, 7 moderate unresolved Expo toolchain findings                                                         |
| GitHub repository               | Local checkout exists; remote create denied by integration permission, subsequent lookup 404                   |
| Vercel project/deployment       | Public website READY at https://www.plugnear.in; HTTPS and deployed browser checks pass; admin remains preview |
| Payments / UPI                  | Not provisioned or implemented; checkout unavailable                                                           |
| EAS / stores                    | Profiles prepared; no project/signing access, build or submission                                              |
| Live booking/payment end-to-end | Not performed; pending schema and payment setup                                                                |

Earlier native Hermes exports passed. The latest host/brand copy changes passed TypeScript checks and web export; signed native builds and physical-device checks remain outstanding.

The codebase, migration, tests and generated bundles can be reviewed locally. Pre-launch deployment URLs and remaining DNS records are recorded in [infrastructure results](INFRASTRUCTURE.md). See [release procedure](RELEASE.md), [security findings](SECURITY.md), and [next stages](ROADMAP.md).

Latest public website deployment: see [website release](WEBSITE_RELEASE.md). Booking/payment launch remains pending.
